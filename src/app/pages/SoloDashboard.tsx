import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Home,
  ListChecks,
  BrainCircuit,
  HeartPulse,
  Send,
  X,
  Quote,
  HelpCircle,
  Lightbulb,
  HeartHandshake,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SoloAnalysisLoadingView, SOLO_LOADING_STEPS } from "./SoloLoading";
import {
  api,
  type AnalysisStatement,
  type ApiError,
  type LlmEvidenceResult,
  type LlmResult,
  type SingleAnalysisResult,
} from "../utils/api";

/* ── Types ── */
interface KeywordItem {
  text: string;
  sourceText: string;
  confidence: number;
}
interface SelectedNode extends KeywordItem {
  rect: DOMRect;
}

const CATEGORIES = [
  { id: "fact" as const, label: "사실", en: "Fact", icon: ListChecks, color: "#818CF8", bg: "#EEF2FF" },
  { id: "interpretation" as const, label: "해석", en: "Interpret", icon: BrainCircuit, color: "#F0A858", bg: "#FEF6E8" },
  { id: "emotion" as const, label: "감정", en: "Emotion", icon: HeartPulse, color: "#E88FA0", bg: "#FDF2F4" },
  { id: "request" as const, label: "요구", en: "Need", icon: Send, color: "#5BB89A", bg: "#E8F6F0" },
];

interface SoloDashboardData {
  title: string;
  date: string;
  keywords: Record<(typeof CATEGORIES)[number]["id"], KeywordItem[]>;
  aiSummary: string;
  thoughtPoint: {
    coreDesire: string;
    description: string;
  };
  aiAnalysis: {
    mainInsight: string;
    advice: string[];
  };
  clarifyingQuestions: string[];
}

type SoloCategoryKey = keyof SoloDashboardData["keywords"];

const EMPTY_SOLO_DATA: SoloDashboardData = {
  title: "",
  date: "",
  keywords: {
    fact: [],
    interpretation: [],
    emotion: [],
    request: [],
  },
  aiSummary: "",
  thoughtPoint: {
    coreDesire: "",
    description: "",
  },
  aiAnalysis: {
    mainInsight: "",
    advice: [],
  },
  clarifyingQuestions: [],
};

const LABEL_TO_CATEGORY: Record<string, SoloCategoryKey> = {
  FACT: "fact",
  F: "fact",
  INTERPRETATION: "interpretation",
  I: "interpretation",
  EMOTION: "emotion",
  E: "emotion",
  NEED: "request",
  N: "request",
};

const EVIDENCE_TO_CATEGORY: Record<"facts" | "interpretations" | "emotions" | "needs", SoloCategoryKey> = {
  facts: "fact",
  interpretations: "interpretation",
  emotions: "emotion",
  needs: "request",
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function toPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function shorten(text: string, max = 14) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function keywordFromStatement(statement: AnalysisStatement): KeywordItem {
  return {
    text: shorten(statement.text),
    sourceText: statement.text,
    confidence: toPercent(statement.confidence),
  };
}

function keywordsFromStatements(statements: AnalysisStatement[]) {
  const grouped: SoloDashboardData["keywords"] = {
    fact: [],
    interpretation: [],
    emotion: [],
    request: [],
  };

  statements.forEach((statement) => {
    const key = LABEL_TO_CATEGORY[statement.label];
    if (!key || grouped[key].length >= 5) return;
    grouped[key].push(keywordFromStatement(statement));
  });

  return grouped;
}

function mergeEvidenceKeywords(
  fallback: SoloDashboardData["keywords"],
  evidence: LlmEvidenceResult | null,
) {
  if (!evidence) return fallback;

  const next = { ...fallback };
  (Object.keys(EVIDENCE_TO_CATEGORY) as Array<keyof typeof EVIDENCE_TO_CATEGORY>).forEach((evidenceKey) => {
    const category = EVIDENCE_TO_CATEGORY[evidenceKey];
    const items = evidence.keywordEvidence[evidenceKey] ?? [];
    if (!items.length) return;

    next[category] = items.slice(0, 5).map((item) => {
      const firstEvidence = item.evidence[0];
      return {
        text: item.keyword,
        sourceText: firstEvidence?.text ?? item.keyword,
        confidence: firstEvidence?.confidencePercent ?? toPercent(firstEvidence?.confidence),
      };
    });
  });

  return next;
}

function buildSoloDashboardData({
  single,
  llm,
  evidence,
}: {
  single: SingleAnalysisResult | null;
  llm: LlmResult | null;
  evidence: LlmEvidenceResult | null;
}): SoloDashboardData {
  const sections = llm?.sections;
  const dk = llm?.diagramKeywords;

  // GPT 키워드 → 모델 evidence(원문+신뢰도) 매핑
  const ev = evidence?.keywordEvidence;
  const makeEvMap = (section?: { keyword: string; evidence: { text: string; confidence?: number; confidencePercent?: number }[] }[]) =>
    new Map((section ?? []).map(({ keyword, evidence: items }) => [keyword, items[0] ?? null]));

  const factEvMap   = makeEvMap(ev?.facts);
  const interpEvMap = makeEvMap(ev?.interpretations);
  const emotEvMap   = makeEvMap(ev?.emotions);
  const needEvMap   = makeEvMap(ev?.needs);

  const kwFromGpt = (
    list: string[],
    evMap: Map<string, { text: string; confidence?: number; confidencePercent?: number } | null>,
  ): KeywordItem[] =>
    list.map((kw) => {
      const e = evMap.get(kw);
      return {
        text: shorten(kw),
        sourceText: e?.text ?? kw,
        confidence: e?.confidencePercent ?? toPercent(e?.confidence),
      };
    });

  // GPT가 뽑은 diagramKeywords(flat) 우선 사용 + 모델 신뢰도 매핑, 없으면 evidence → statements 폴백
  const llmKeywords: SoloDashboardData["keywords"] = {
    fact:           kwFromGpt(dk?.facts ?? [], factEvMap),
    interpretation: kwFromGpt(dk?.interpretations ?? [], interpEvMap),
    emotion:        kwFromGpt(dk?.emotions ?? [], emotEvMap),
    request:        kwFromGpt(dk?.needs ?? [], needEvMap),
  };

  const hasLlmKeywords = Object.values(llmKeywords).some((arr) => arr.length > 0);
  const keywords = hasLlmKeywords
    ? llmKeywords
    : mergeEvidenceKeywords(keywordsFromStatements(single?.statements ?? []), evidence);

  const coreDesire =
    dk?.needs?.[0] ??
    dk?.coreConflict?.[0] ??
    "";
  const mainInsight =
    sections?.interpretations?.self ||
    sections?.facts?.self ||
    llm?.resultText ||
    "";
  const thoughtDescription =
    sections?.emotions?.self ||
    sections?.interpretations?.self ||
    sections?.needs?.self ||
    "";

  return {
    title: dk?.coreConflict?.[0] ? `${dk.coreConflict[0]} 정리` : "생각 정리 결과",
    date: formatDate(llm?.createdAt ?? single?.session.createdAt),
    keywords,
    aiSummary: llm?.resultText || "",
    thoughtPoint: {
      coreDesire,
      description: thoughtDescription,
    },
    aiAnalysis: {
      mainInsight,
      advice: sections?.needs?.self ? [sections.needs.self] : [],
    },
    clarifyingQuestions: sections?.questions ?? [],
  };
}

async function getOrCreateLlmAnalysis(sessionId: string, retryCount = 0): Promise<LlmResult> {
  try {
    return await api.getLlmAnalysis(sessionId);
  } catch (error) {
    const getError = error as ApiError;
    if (getError.code !== "LLM_RESULT_NOT_FOUND") throw error;
  }

  try {
    return await api.generateLlmAnalysis(sessionId);
  } catch (error) {
    const createError = error as ApiError;
    if (createError.code === "ANALYSIS_NOT_READY" && retryCount < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return getOrCreateLlmAnalysis(sessionId, retryCount + 1);
    }
    throw error;
  }
}

/* ── Fixed Portal Tooltip ── */
function FixedTooltip({ node, onClose }: { node: SelectedNode; onClose: () => void }) {
  const tooltipWidth = 272;
  const margin = 12;
  const rect = node.rect;
  const centerX = rect.left + rect.width / 2;
  let left = centerX - tooltipWidth / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
  const spaceBelow = window.innerHeight - rect.bottom;
  const showBelow = spaceBelow > 160;
  const top = showBelow ? rect.bottom + 8 : rect.top - 8;
  const translateY = showBelow ? "0" : "-100%";

  return createPortal(
    <motion.div
      key="solo-tooltip"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className="pointer-events-auto"
      style={{ position: "fixed", left, top, width: tooltipWidth, zIndex: 99999, transform: `translateY(${translateY})` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#1C1C1E] text-white rounded-2xl p-4 shadow-2xl border border-white/10 relative">
        <div className="flex items-center justify-between mb-2.5 pr-6">
          <div className="flex items-center gap-1.5">
            <Quote size={11} className="text-[#ffd1da]" strokeWidth={3} />
            <p className="font-semibold text-[11.5px] text-white/70">입력된 원문</p>
          </div>
          {node.confidence > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#ffd1da]/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
              <span className="text-[10.5px] font-semibold text-[#ffd1da]">신뢰도 {Math.min(node.confidence, 99)}%</span>
            </div>
          )}
        </div>
        <p className="text-[12.5px] text-white/90 leading-relaxed break-keep">"{node.sourceText}"</p>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>,
    document.body
  );
}

/* ── Keyword chip button ── */
function KeywordChip({
  item,
  color,
  bg,
  onSelect,
  isSelected,
}: {
  item: KeywordItem;
  color: string;
  bg: string;
  onSelect: (item: KeywordItem, rect: DOMRect) => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item, e.currentTarget.getBoundingClientRect());
      }}
      className={`px-3 py-2 rounded-2xl text-[12px] font-semibold transition-all active:scale-95 break-keep text-center leading-snug ${isSelected ? "ring-2 ring-offset-1" : ""}`}
      style={{
        backgroundColor: isSelected ? color : bg,
        color: isSelected ? "#fff" : color,
        ringColor: color,
      }}
    >
      {item.text}
    </button>
  );
}

/* ── Branching diagram for one category ── */
function BranchDiagram({
  items,
  cat,
  onSelect,
  selectedNode,
}: {
  items: KeywordItem[];
  cat: typeof CATEGORIES[0];
  onSelect: (item: KeywordItem, rect: DOMRect) => void;
  selectedNode: SelectedNode | null;
}) {
  const Icon = cat.icon;

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-[13px] text-[#AEAEB2]">
        해당 항목이 없어요
      </div>
    );
  }

  // Split into rows of max 3
  const rows: KeywordItem[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <div className="flex flex-col items-center py-7 px-3">
      {/* Root node */}
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold border"
        style={{ backgroundColor: cat.bg, color: cat.color, borderColor: `${cat.color}25` }}
      >
        <Icon size={14} strokeWidth={2.5} />
        {cat.label} {cat.en}
      </div>

      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex flex-col items-center w-full max-w-[380px]">
          {/* Trunk from root (or previous row) */}
          <div className="w-[2px] h-7 bg-[#E5E5EA]" />

          {/* Horizontal bar + drops */}
          <div className="relative w-full">
            {row.length > 1 && (
              <div
                className="absolute top-0 h-[2px] bg-[#E5E5EA]"
                style={{
                  left: `${100 / (2 * row.length)}%`,
                  right: `${100 / (2 * row.length)}%`,
                }}
              />
            )}
            <div className="flex justify-around w-full">
              {row.map((item, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: `${100 / row.length}%` }}>
                  <div className="w-[2px] h-5 bg-[#E5E5EA]" />
                  <div className="px-1 w-full flex justify-center">
                    <KeywordChip
                      item={item}
                      color={cat.color}
                      bg={cat.bg}
                      onSelect={onSelect}
                      isSelected={selectedNode?.text === item.text}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Solo FEIN 2×2 Grid ── */
function SoloFeinGrid({ data }: { data: SoloDashboardData }) {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  const handleSelect = (item: KeywordItem, rect: DOMRect) => {
    setSelectedNode(prev => prev?.text === item.text ? null : { ...item, rect });
  };

  useEffect(() => {
    const dismiss = () => setSelectedNode(null);
    document.addEventListener("click", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("click", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, []);

  return (
    <div className="px-4 sm:px-5 pt-5 pb-3">
      <AnimatePresence>
        {selectedNode && (
          <FixedTooltip node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>

      {/* 핵심 포인트 허브 */}
      {data.thoughtPoint.coreDesire && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-center"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <p className="text-[9px] font-bold text-[#9CA3AF] tracking-[0.18em] uppercase mb-2">핵심 포인트</p>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[13px] font-semibold bg-white"
            style={{ color: "#8AB4D4", border: "1.5px solid #8AB4D460" }}
          >
            {data.thoughtPoint.coreDesire}
          </span>
        </motion.div>
      )}

      {/* 2×2 FEIN 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          const items = data.keywords[cat.id];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.07, type: "spring", stiffness: 260, damping: 24 }}
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: `${cat.color}50`, boxShadow: `0 1px 8px ${cat.color}10` }}
            >
              {/* 카드 헤더 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white"
                   style={{ borderBottom: `1px solid ${cat.color}30` }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                  <Icon size={10} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                <span className="ml-auto text-[8px] font-semibold opacity-40 tracking-wide" style={{ color: cat.color }}>{cat.en}</span>
              </div>

              {/* 키워드 칩 */}
              <div className="p-2.5 flex flex-col gap-1.5" style={{ containerType: "inline-size" }}>
                {items.length > 0 ? (
                  items.map((item, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.07 + i * 0.04 }}
                      onClick={(e) => { e.stopPropagation(); handleSelect(item, e.currentTarget.getBoundingClientRect()); }}
                      className={`w-full px-2.5 py-[6px] rounded-xl text-center break-keep leading-tight border bg-white transition-all active:scale-95 ${selectedNode?.text === item.text ? "ring-2 ring-offset-1" : "hover:opacity-80"}`}
                      style={{
                        fontSize: "calc(0.45cqw + 7px)",
                        color: cat.color,
                        borderColor: `${cat.color}50`,
                        ringColor: cat.color,
                      } as React.CSSProperties}
                    >
                      {item.text}
                    </motion.button>
                  ))
                ) : (
                  <span className="text-[11px] text-[#C7C7CC] py-3 text-center block">—</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-[#B0B0BA] mt-3 tracking-wide">키워드를 탭하면 원문을 확인할 수 있어요</p>
    </div>
  );
}

/* ── Main Solo Dashboard ── */
export function SoloDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<SoloDashboardData>(EMPTY_SOLO_DATA);
  const [expandedAdvice, setExpandedAdvice] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let cancelled = false;

    try {
      const stored = sessionStorage.getItem("soloData");
      if (!stored) {
        setData(EMPTY_SOLO_DATA);
        setApiError("분석 데이터가 없습니다. 홈으로 돌아가 다시 시도해주세요.");
        return;
      }

      const parsed = JSON.parse(stored) as { sessionId?: string; text?: string };
      if (!parsed.sessionId) {
        setData(EMPTY_SOLO_DATA);
        setApiError("세션 정보가 없습니다. 다시 시도해주세요.");
        return;
      }

      const load = async () => {
        setIsApiLoading(true);
        setApiError("");

        try {
          const singleResult = await api.getSingleResults(parsed.sessionId!);
          const llmResult = await getOrCreateLlmAnalysis(parsed.sessionId!);
          const evidenceResult = await api.getLlmEvidence(parsed.sessionId!).catch(() => null);

          if (cancelled) return;
          setData(buildSoloDashboardData({
            single: singleResult,
            llm: llmResult,
            evidence: evidenceResult,
          }));
        } catch (error) {
          if (cancelled) return;
          const reason = error as { message?: string };
          setData(EMPTY_SOLO_DATA);
          setApiError(reason.message ?? "분석 결과를 아직 불러오지 못했습니다.");
        } finally {
          if (!cancelled) setIsApiLoading(false);
        }
      };

      void load();
    } catch (error) {
      console.error("생각 정리 분석 조회 실패", error);
    }

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isApiLoading) {
      setLoadingStep(0);
      return;
    }

    const timer = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, SOLO_LOADING_STEPS.length - 1));
    }, 900);

    return () => clearInterval(timer);
  }, [isApiLoading]);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBF0] px-5 h-14 flex items-center justify-between sticky top-0 z-[500]">
        <button
          onClick={() => navigate("/home")}
          className="w-8 h-8 flex items-center justify-center text-[#636366] hover:text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-lg transition-all"
        >
          <Home size={18} strokeWidth={2} />
        </button>
        <p className="text-[15px] font-bold text-[#1C1C1E] tracking-tight">생각 정리 결과</p>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto pb-12 w-full max-w-[1120px] mx-auto">
        {isApiLoading && !apiError ? (
          <SoloAnalysisLoadingView currentStep={loadingStep} fullScreen={false} />
        ) : (
          <>
        {/* Title */}
        <div className="px-5 pt-6 pb-5 bg-white border-b border-[#EBEBF0]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 bg-[#fff5f7] rounded-full text-[11.5px] font-semibold text-[#c9485b]">
              {data.date}
            </span>
            <span className="px-2.5 py-0.5 bg-[#F5F5F7] rounded-full text-[11.5px] font-semibold text-[#636366]">
              생각 정리
            </span>
          </div>
          <p className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-1.5">{data.title}</p>
          <p className="text-[13px] text-[#AEAEB2] font-normal">
            AI가 당신의 이야기를 구조화하여 정리했어요.
          </p>
        </div>

        {apiError && (
          <div className="px-4 sm:px-5 pt-5">
            <div className="rounded-2xl border p-4 bg-[#FFF8F8] border-red-100">
              <p className="text-[13px] font-semibold text-red-500">
                {apiError}
              </p>
            </div>
          </div>
        )}

        {!apiError && (
          <>
        {/* FEIN 2×2 그리드 */}
        <SoloFeinGrid data={data} />

        {/* Section 1: AI 요약 */}
        <div className="px-4 sm:px-5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-[#EBEBF0] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} strokeWidth={2.5} />
              </div>
              <p className="text-[14.5px] font-bold text-[#1C1C1E]">AI 요약</p>
              <span className="ml-auto text-[11px] text-[#AEAEB2] font-medium">상황을 중립적으로 요약</span>
            </div>
            <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]">
              <p className="text-[13.5px] text-[#636366] leading-relaxed break-keep">
                {data.aiSummary}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Section 2: 생각정리가 필요했던 지점 */}
        <div className="px-4 sm:px-5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-[#EBEBF0] p-5 overflow-hidden relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ffd1da] to-[#ffb3c4] rounded-l-2xl" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-[#fff5f7] text-[#c9485b] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={14} strokeWidth={2.5} />
                </div>
                <p className="text-[12px] font-semibold text-[#c9485b]">생각정리가 필요했던 지점</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#fff5f7] rounded-xl px-3 py-1.5 mb-3">
                <span className="text-[13.5px] font-bold text-[#c9485b]">{data.thoughtPoint.coreDesire}</span>
              </div>
              <p className="text-[13.5px] text-[#636366] leading-relaxed break-keep">
                {data.thoughtPoint.description}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Section 3: AI 종합 분석 */}
        <div className="px-4 sm:px-5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0">
                <HeartHandshake size={15} strokeWidth={2.5} />
              </div>
              <p className="text-[14.5px] font-bold text-[#1C1C1E]">AI 종합 분석 · 조언</p>
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#ffd1da]/15 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffd1da] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#c9485b]">AI 생성</span>
              </div>
            </div>

            {/* Main Insight */}
            <div className="bg-gradient-to-br from-[#ffd1da] to-[#ffb3c4] rounded-2xl p-5 mb-3"
              style={{ boxShadow: "rgba(255,145,168,0.25) 0 4px 16px 0" }}>
              <p className="text-[11px] font-semibold text-[#c9485b]/60 mb-2 uppercase tracking-wider">핵심 인사이트</p>
              <p className="text-[15px] font-bold text-[#222222] leading-relaxed break-keep">
                "{data.aiAnalysis.mainInsight}"
              </p>
            </div>

            {/* Advice Cards */}
            <div className="bg-white rounded-2xl border border-[#EBEBF0] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-[#ffd1da] rounded-full" />
                <p className="text-[13.5px] font-bold text-[#1C1C1E]">이렇게 해보는 건 어떨까요</p>
              </div>
              <div className="space-y-3">
                {data.aiAnalysis.advice.slice(0, expandedAdvice ? undefined : 2).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex gap-3 items-start"
                  >
                    <div className="min-w-[22px] h-[22px] rounded-full bg-[#fff5f7] text-[#c9485b] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-[13px] text-[#636366] leading-relaxed">{item}</p>
                  </motion.div>
                ))}
              </div>
              {data.aiAnalysis.advice.length > 2 && (
                <button
                  onClick={() => setExpandedAdvice(!expandedAdvice)}
                  className="mt-3 flex items-center gap-1 text-[12.5px] text-[#c9485b] font-semibold hover:opacity-70 transition-opacity"
                >
                  {expandedAdvice ? "접기" : `${data.aiAnalysis.advice.length - 2}개 더 보기`}
                  <ChevronRight size={14} className={`transition-transform ${expandedAdvice ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Clarifying Questions */}
        <div className="px-4 sm:px-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl p-5 border border-[#EBEBF0]"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0">
                <HelpCircle size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[14.5px] font-bold text-[#1C1C1E]">스스로에게 물어보기</p>
            </div>
            <p className="text-[12.5px] text-[#AEAEB2] mb-4 font-normal">
              아래 질문들이 생각을 더 깊이 정리하는 데 도움이 될 수 있어요.
            </p>
            <div className="space-y-2.5">
              {data.clarifyingQuestions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.07 }}
                  className="flex gap-3 items-start bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]"
                >
                  <div className="min-w-5 h-5 rounded-full bg-[#fff5f7] text-[#c9485b] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-[13px] text-[#636366] leading-relaxed font-normal">{q}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
