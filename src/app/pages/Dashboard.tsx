import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  ListChecks,
  BrainCircuit,
  HeartPulse,
  Send,
  HelpCircle,
  Target,
  X,
  Quote,
  Wand2,
  AlertCircle,
  Sparkles,
  AlignLeft,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  api,
  type ApiError,
  type LlmResult,
  type DualAnalysisResult,
  type LlmEvidenceResult,
} from "../utils/api";

/* ═══════════════════════════════════════════════
   Types
═══════════════════════════════════════════════ */
interface KeywordItem {
  text: string;
  sourceText: string;
  confidence: number;
  sourceKind: "input" | "analysis";
}
interface SelectedNode extends KeywordItem { rect: DOMRect; side: "A" | "B" | "shared"; }

type FeinCatId = "facts" | "interpretations" | "emotions" | "needs";

/* ═══════════════════════════════════════════════
   Constants
═══════════════════════════════════════════════ */
const DASHBOARD_DATA_TEMPLATE = {
  title: "",
  date: "",
  relationship: "",
  me: { name: "A" },
  partner: { name: "B" },
  mindmap: {
    fact: {
      shared: [] as KeywordItem[],
      meOnly: [] as KeywordItem[],
      partnerOnly: [] as KeywordItem[],
    },
    interpretation: { shared: [] as KeywordItem[], meOnly: [] as KeywordItem[], partnerOnly: [] as KeywordItem[] },
    emotion: {
      shared: [] as KeywordItem[],
      meOnly: [] as KeywordItem[],
      partnerOnly: [] as KeywordItem[],
    },
    request: {
      shared: [] as KeywordItem[],
      meOnly: [] as KeywordItem[],
      partnerOnly: [] as KeywordItem[],
    },
  },
  interpretationBranches: [] as Array<{
    id: string;
    fact: KeywordItem;
    me: KeywordItem[];
    partner: KeywordItem[];
  }>,
  conflictPeak: { type: "", category: "", description: "" },
  aiRestatements: {
    fact: { me: "", partner: "" },
    interpretation: { me: "", partner: "" },
    emotion: { me: "", partner: "" },
    request: { me: "", partner: "" },
  },
  aiSummaryAndRestatement: {
    neutralSummary: "",
    aFromBPerspective: "",
    bFromAPerspective: "",
    confidence: 0,
  },
  clarifyingQuestions: [] as string[],
};

const CATEGORIES = [
  { id: "facts" as const,           label: "사실", en: "Facts",      icon: ListChecks,   color: "#6B8CF5", bg: "transparent" },
  { id: "interpretations" as const, label: "해석", en: "Interpret",  icon: BrainCircuit, color: "#E8A04A", bg: "transparent" },
  { id: "emotions" as const,        label: "감정", en: "Emotions",   icon: HeartPulse,   color: "#E07898", bg: "transparent" },
  { id: "needs" as const,           label: "요구", en: "Needs",      icon: Send,         color: "#3DB389", bg: "transparent" },
];

type DashboardData = typeof DASHBOARD_DATA_TEMPLATE;
type CategoryId = typeof CATEGORIES[number]["id"];
type MindmapKey = keyof DashboardData["mindmap"];
type KeywordEvidenceEntry = NonNullable<LlmEvidenceResult["keywordEvidence"][CategoryId]>[number];

const MINDMAP_KEY_BY_CATEGORY: Record<CategoryId, MindmapKey> = {
  facts: "fact",
  interpretations: "interpretation",
  emotions: "emotion",
  needs: "request",
};

const TENSION_STYLES: Record<string, { color: string; bg: string }> = {
  FACT_CONFLICT:      { color: "#DC4C4C", bg: "#FFF1F1" },
  PERSPECTIVE_GAP:    { color: "#D9820A", bg: "#FEF5E7" },
  EMOTION_NEED_GAP:   { color: "#C45B7B", bg: "#FDF0F4" },
  LABEL_MISMATCH:     { color: "#5B5FCF", bg: "#EEEEFF" },
  UNADDRESSED_NEEDS:  { color: "#28916A", bg: "#E6F7F2" },
  INTERPRETATION_GAP: { color: "#7C3AED", bg: "#F5F0FF" },
};

/* ═══════════════════════════════════════════════
   Design Tokens
═══════════════════════════════════════════════ */
const A_COLOR   = "#D95A78";  // rose — 주체 A
const B_COLOR   = "#6B6FCC";  // indigo — 주체 B
const A_LIGHT   = "#FFF5F7";
const B_LIGHT   = "#F3F3FC";
const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)";

/* ═══════════════════════════════════════════════
   Helper Functions
═══════════════════════════════════════════════ */
function shortenForChip(text: string, max = 14) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function makeKeyword(
  text: string,
  sourceText = text,
  sourceKind: KeywordItem["sourceKind"] = "analysis",
): KeywordItem {
  return { text: shortenForChip(text), sourceText, sourceKind, confidence: 0 };
}

function makeMindmapGroup(
  keywords: string[] | undefined,
  sectionEvidence?: KeywordEvidenceEntry[],
) {
  const evidenceMap = new Map(
    (sectionEvidence ?? []).map(({ keyword, evidence }) => [keyword, evidence[0] ?? null])
  );
  const makeKwWithEvidence = (text: string): KeywordItem => {
    const ev = evidenceMap.get(text);
    return {
      text: shortenForChip(text),
      sourceText: ev?.text ?? text,
      sourceKind: ev?.text ? "input" : "analysis",
      confidence: ev?.confidencePercent ?? 0,
    };
  };

  // evidence의 speaker 필드(A | B | SELF)로 A전용 / B전용 / 공통 분류
  const meOnly: KeywordItem[]      = [];
  const partnerOnly: KeywordItem[] = [];
  const shared: KeywordItem[]      = [];

  for (const kw of (keywords ?? [])) {
    const ev   = evidenceMap.get(kw);
    const item = makeKwWithEvidence(kw);
    if (ev?.speaker === "A") meOnly.push(item);
    else if (ev?.speaker === "B") partnerOnly.push(item);
    else shared.push(item); // SELF / 증거 없음 → 공통 영역
  }

  return { shared, meOnly, partnerOnly };
}

function buildMindmapData({
  llmResult, aName, bName, relationship, date, evidenceResult,
}: {
  llmResult: LlmResult; aName: string; bName: string;
  relationship: string; date: string; evidenceResult: LlmEvidenceResult | null;
}): DashboardData {
  const { sections, diagramKeywords, resultText } = llmResult;
  const ev = evidenceResult?.keywordEvidence;

  // evidence map으로 원문 소스 텍스트 매핑
  const makeEvMap = (section: typeof ev extends undefined ? never : NonNullable<typeof ev>[keyof NonNullable<typeof ev>]) =>
    new Map((section ?? []).map(({ keyword, evidence }) => [keyword, evidence[0] ?? null]));

  const kwFromList = (
    list: string[],
    evMap: Map<string, { text: string; confidencePercent: number; speaker: string } | null>,
  ): KeywordItem[] =>
    list.map((kw) => {
      const e = evMap.get(kw);
      return {
        text: shortenForChip(kw),
        sourceText: e?.text ?? kw,
        sourceKind: (e?.text ? "input" : "analysis") as KeywordItem["sourceKind"],
        confidence: e?.confidencePercent ?? 0,
      };
    });

  const factEvMap   = makeEvMap(ev?.facts);
  const interpEvMap = makeEvMap(ev?.interpretations);
  const emotEvMap   = makeEvMap(ev?.emotions);
  const needEvMap   = makeEvMap(ev?.needs);

  const dk = diagramKeywords;

  // 해석 분기: 공통 사실 키워드를 허브로, A해석/B해석을 분기로
  const hubFact = dk.common?.facts?.[0] || dk.coreConflict?.[0] || "";
  const hubEv = factEvMap.get(hubFact) ?? null;
  const interpretationBranch = (dk.a?.interpretations?.length || dk.b?.interpretations?.length)
    ? [{
        id: "api-interpretation",
        fact: {
          text: shortenForChip(hubFact || "해석"),
          sourceText: hubEv?.text ?? hubFact,
          sourceKind: (hubEv?.text ? "input" : "analysis") as KeywordItem["sourceKind"],
          confidence: hubEv?.confidencePercent ?? 0,
        },
        me:      kwFromList(dk.a?.interpretations ?? [], interpEvMap),
        partner: kwFromList(dk.b?.interpretations ?? [], interpEvMap),
      }]
    : [];

  return {
    title: dk.coreConflict?.[0] || "분석 결과",
    date, relationship,
    me: { name: aName },
    partner: { name: bName },
    mindmap: {
      fact: {
        meOnly:      kwFromList(dk.a?.facts     ?? [], factEvMap),
        partnerOnly: kwFromList(dk.b?.facts     ?? [], factEvMap),
        shared:      kwFromList(dk.common?.facts ?? [], factEvMap),
      },
      interpretation: {
        meOnly:      kwFromList(dk.a?.interpretations ?? [], interpEvMap),
        partnerOnly: kwFromList(dk.b?.interpretations ?? [], interpEvMap),
        shared:      [],
      },
      emotion: {
        meOnly:      kwFromList(dk.a?.emotions     ?? [], emotEvMap),
        partnerOnly: kwFromList(dk.b?.emotions     ?? [], emotEvMap),
        shared:      kwFromList(dk.common?.emotions ?? [], emotEvMap),
      },
      request: {
        meOnly:      kwFromList(dk.a?.needs     ?? [], needEvMap),
        partnerOnly: kwFromList(dk.b?.needs     ?? [], needEvMap),
        shared:      kwFromList(dk.common?.needs ?? [], needEvMap),
      },
    },
    interpretationBranches: interpretationBranch,
    conflictPeak: { type: "", category: "", description: "" },
    aiRestatements: {
      fact:           { me: sections.facts.a || "",           partner: sections.facts.b || "" },
      interpretation: { me: sections.interpretations.a || "", partner: sections.interpretations.b || "" },
      emotion:        { me: sections.emotions.a || "",        partner: sections.emotions.b || "" },
      request:        { me: sections.needs.a || "",           partner: sections.needs.b || "" },
    },
    aiSummaryAndRestatement: {
      neutralSummary:     resultText,
      aFromBPerspective:  sections.interpretations.b || sections.emotions.b || "",
      bFromAPerspective:  sections.interpretations.a || sections.emotions.a || "",
      confidence: 0,
    },
    clarifyingQuestions: sections.questions,
  };
}

/* ═══════════════════════════════════════════════
   Skeleton Loading
═══════════════════════════════════════════════ */
function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E8E8EC] rounded-xl ${className ?? ""}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto pb-12 w-full max-w-[1120px] mx-auto">
      <div className="h-[200px] bg-[#1A1828] mb-px" />
      <div className="px-5 py-6 space-y-3">
        <Bone className="h-5 w-24 rounded-full" />
        <Bone className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        <Bone className="h-5 w-32 rounded-full" />
        <Bone className="h-36 w-full rounded-2xl" />
        <Bone className="h-36 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section Header (refined)
═══════════════════════════════════════════════ */
function SectionLabel({ label, icon: Icon, color = "#A1A1AA" }: {
  label: string;
  icon?: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <div className="w-5 h-5 flex items-center justify-center" style={{ color }}>
          <Icon size={13} strokeWidth={2.5} />
        </div>
      )}
      <span
        className="text-[10.5px] font-black tracking-[0.11em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex-1 h-px ml-1" style={{ background: `${color}30` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEIN 노드 내부 — Venn 다이어그램
═══════════════════════════════════════════════ */
interface SvgLine { x1: number; y1: number; x2: number; y2: number; color: string; }

function FeinNodeVenn({
  catData, cat, aLabel, bLabel, pick, sel, myRole,
}: {
  catData: { meOnly: KeywordItem[]; shared: KeywordItem[]; partnerOnly: KeywordItem[] };
  cat: typeof CATEGORIES[number];
  aLabel: string; bLabel: string;
  pick: (item: KeywordItem, rect: DOMRect, side: "A" | "B" | "shared") => void;
  sel: SelectedNode | null;
  myRole?: "A" | "B" | null;
}) {
  return (
    <div style={{ containerType: "inline-size" }}>
      {/* 3컬럼: [A 전용] | [공통] | [B 전용] */}
      <div className="grid grid-cols-3">

        {/* ── A 전용 구역 ── */}
        <div className="flex flex-col items-center gap-1 px-1.5 pt-2.5 pb-3"
             style={{
               background: `${A_COLOR}09`,
               borderRight: `1px solid ${A_COLOR}18`,
             }}>
          {/* A 이름 레이블 */}
          <span className="text-[7.5px] font-black tracking-wide mb-1 text-center w-full truncate"
                style={{ color: A_COLOR }}>
            {aLabel}
          </span>
          {catData.meOnly.length > 0
            ? catData.meOnly.map((item, i) => (
                <KwBtn key={i} item={item}
                  onSelect={(it, rect) => {
                    if (myRole === "B") return;
                    pick(it, rect, "A");
                  }}
                  isSelected={sel?.text === item.text}
                  className="w-full px-1.5 py-[5px] rounded-lg text-center break-keep leading-tight border hover:opacity-80 transition-opacity"
                  style={{
                    fontSize: "calc(0.40cqw + 6.5px)",
                    color: A_COLOR,
                    background: A_LIGHT,
                    borderColor: `${A_COLOR}25`,
                  }} />
              ))
            : <span className="text-[#D4D4D8] py-1 text-[10px]">—</span>
          }
        </div>

        {/* ── 공통(교집합) 구역 ── */}
        <div className="flex flex-col items-center gap-1 px-1.5 pt-2.5 pb-3">
          {/* 중앙 세 점 아이콘 */}
          <div className="flex items-center gap-[3px] mb-1 mt-[1px]">
            <div className="w-[4px] h-[4px] rounded-full flex-shrink-0"
                 style={{ background: A_COLOR, opacity: 0.45 }} />
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                 style={{ background: cat.color }} />
            <div className="w-[4px] h-[4px] rounded-full flex-shrink-0"
                 style={{ background: B_COLOR, opacity: 0.45 }} />
          </div>
          {catData.shared.length > 0
            ? catData.shared.map((item, i) => (
                <KwBtn key={i} item={item}
                  onSelect={(it, rect) => pick(it, rect, "shared")}
                  isSelected={sel?.text === item.text}
                  className="w-full px-1.5 py-[5px] rounded-lg text-center break-keep leading-tight border bg-white transition-colors"
                  style={{
                    fontSize: "calc(0.40cqw + 6.5px)",
                    color: cat.color,
                    borderColor: `${cat.color}60`,
                  }} />
              ))
            : <span className="text-[#D4D4D8] py-1 text-[10px]">—</span>
          }
        </div>

        {/* ── B 전용 구역 ── */}
        <div className="flex flex-col items-center gap-1 px-1.5 pt-2.5 pb-3"
             style={{
               background: `${B_COLOR}09`,
               borderLeft: `1px solid ${B_COLOR}18`,
             }}>
          {/* B 이름 레이블 */}
          <span className="text-[7.5px] font-black tracking-wide mb-1 text-center w-full truncate"
                style={{ color: B_COLOR }}>
            {bLabel}
          </span>
          {catData.partnerOnly.length > 0
            ? catData.partnerOnly.map((item, i) => (
                <KwBtn key={i} item={item}
                  onSelect={(it, rect) => {
                    if (myRole === "A") return;
                    pick(it, rect, "B");
                  }}
                  isSelected={sel?.text === item.text}
                  className="w-full px-1.5 py-[5px] rounded-lg text-center break-keep leading-tight border hover:opacity-80 transition-opacity"
                  style={{
                    fontSize: "calc(0.40cqw + 6.5px)",
                    color: B_COLOR,
                    background: B_LIGHT,
                    borderColor: `${B_COLOR}25`,
                  }} />
              ))
            : <span className="text-[#D4D4D8] py-1 text-[10px]">—</span>
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEIN 노드 내부 — 해석 분기 트리
═══════════════════════════════════════════════ */
function FeinNodeInterp({
  branches, aLabel, bLabel, pick, sel, myRole,
}: {
  branches: DashboardData["interpretationBranches"];
  aLabel: string; bLabel: string;
  pick: (item: KeywordItem, rect: DOMRect, side: "A" | "B" | "shared") => void;
  sel: SelectedNode | null;
  myRole?: "A" | "B" | null;
}) {
  if (branches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-6">
        <span className="text-[12px] text-[#AEAEB2]">—</span>
      </div>
    );
  }
  return (
    <div className="px-3 pb-4 pt-3" style={{ containerType: "inline-size" }}>
      {branches.map((branch) => (
        <div key={branch.id} className="flex flex-col items-center">
          {/* 허브 칩 */}
          <KwBtn item={branch.fact} isSelected={sel?.text === branch.fact.text}
            onSelect={(it, rect) => pick(it, rect, "shared")}
            className="px-2.5 py-1.5 rounded-xl font-semibold text-center break-keep border bg-white"
            style={{
              fontSize: "calc(0.52cqw + 7.5px)",
              color: "#6B8CF5",
              borderColor: "#6B8CF580",
            }}
          />

          {/* 분기선 */}
          <div className="relative w-full pointer-events-none" style={{ height: 24 }}>
            <div className="absolute top-0 left-1/2 w-px h-3 -translate-x-1/2" style={{ background: "#D4D4D8" }} />
            <div className="absolute" style={{ top: 12, left: "25%", right: "25%", height: 1, background: "#D4D4D8" }} />
            <div className="absolute w-px h-3" style={{ top: 12, left: "25%", background: "#D4D4D8" }} />
            <div className="absolute w-px h-3" style={{ top: 12, right: "25%", background: "#D4D4D8" }} />
          </div>

          {/* A / B 컬럼 */}
          <div className="w-full grid grid-cols-2 gap-1.5">
            {/* A */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[7.5px] font-black tracking-wider uppercase mb-0.5" style={{ color: A_COLOR }}>
                {aLabel.length > 5 ? aLabel.slice(0, 5) : aLabel}
              </span>
              {branch.me.length > 0
                ? branch.me.map((item, i) => (
                    <KwBtn key={i} item={item} isSelected={sel?.text === item.text}
                      onSelect={(it, rect) => {
                        if (myRole === "B") return;
                        pick(it, rect, "A");
                      }}
                      className="w-full px-2 py-1 rounded-lg text-center break-keep leading-snug border transition-colors"
                      style={{
                        fontSize: "calc(0.44cqw + 7px)",
                        color: A_COLOR,
                        background: A_LIGHT,
                        borderColor: `${A_COLOR}28`,
                      }} />
                  ))
                : <span className="text-[10px] text-[#C7C7CC] py-1.5">—</span>
              }
            </div>
            {/* B */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[7.5px] font-black tracking-wider uppercase mb-0.5" style={{ color: B_COLOR }}>
                {bLabel.length > 5 ? bLabel.slice(0, 5) : bLabel}
              </span>
              {branch.partner.length > 0
                ? branch.partner.map((item, i) => (
                    <KwBtn key={i} item={item} isSelected={sel?.text === item.text}
                      onSelect={(it, rect) => {
                        if (myRole === "A") return;
                        pick(it, rect, "B");
                      }}
                      className="w-full px-2 py-1 rounded-lg text-center break-keep leading-snug border transition-colors"
                      style={{
                        fontSize: "calc(0.44cqw + 7px)",
                        color: B_COLOR,
                        background: B_LIGHT,
                        borderColor: `${B_COLOR}28`,
                      }} />
                  ))
                : <span className="text-[10px] text-[#C7C7CC] py-1.5">—</span>
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEIN 다이어그램 (SVG 연결선 + 노드)
═══════════════════════════════════════════════ */
function FeinDiagram({
  llmResult, aName, bName, myRole, mindmapData,
}: {
  llmResult: LlmResult; aName: string; bName: string;
  myRole: "A" | "B" | null; mindmapData: DashboardData;
}) {
  const [sel, setSel] = useState<SelectedNode | null>(null);
  const { diagramKeywords } = llmResult;

  const wrapRef  = useRef<HTMLDivElement>(null);
  const hubRef   = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);
  const [lines,  setLines]  = useState<SvgLine[]>([]);
  const [svgDim, setSvgDim] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const wrap = wrapRef.current, hub = hubRef.current;
    if (!wrap || !hub) return;
    const wr = wrap.getBoundingClientRect();
    const hr = hub.getBoundingClientRect();
    const hx = hr.left + hr.width / 2 - wr.left;
    const hy = hr.bottom - wr.top;
    const next: SvgLine[] = [];
    nodeRefs.current.forEach((nd, i) => {
      if (!nd) return;
      const nr = nd.getBoundingClientRect();
      next.push({ x1: hx, y1: hy, x2: nr.left + nr.width / 2 - wr.left, y2: nr.top - wr.top, color: CATEGORIES[i].color });
    });
    setLines(next);
    setSvgDim({ w: wr.width, h: wr.height });
  }, []);

  useEffect(() => { const id = setTimeout(measure, 160); return () => clearTimeout(id); }, [measure, llmResult]);
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, [measure]);
  useEffect(() => {
    const off = () => setSel(null);
    document.addEventListener("click", off); window.addEventListener("scroll", off, true);
    return () => { document.removeEventListener("click", off); window.removeEventListener("scroll", off, true); };
  }, []);

  const pick = (item: KeywordItem, rect: DOMRect, side: "A" | "B" | "shared") =>
    setSel(prev => prev?.text === item.text ? null : { ...item, rect, side });

  const getMmCat = (catId: FeinCatId) => mindmapData.mindmap[MINDMAP_KEY_BY_CATEGORY[catId]];

  return (
    <div ref={wrapRef} className="relative">
      <AnimatePresence>
        {sel && <FixedTooltip node={sel} myRole={myRole} onClose={() => setSel(null)} />}
      </AnimatePresence>

      {/* SVG 연결선 */}
      {svgDim.h > 0 && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: svgDim.w, height: svgDim.h, zIndex: 0 }}>
          <defs>
            <linearGradient id="lg-neutral" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {lines.map((l, i) => (
            <g key={i}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="url(#lg-neutral)" strokeWidth="1.5" strokeDasharray="5 5" strokeLinecap="round" />
              <circle cx={l.x2} cy={l.y2} r="3" fill="#9CA3AF" opacity="0.35" />
            </g>
          ))}
          {lines[0] && <circle cx={lines[0].x1} cy={lines[0].y1} r="6" fill="#9CA3AF" opacity="0.2" />}
        </svg>
      )}

      {/* 핵심 갈등 허브 */}
      <motion.div ref={hubRef}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative z-10 mb-5"
      >
        <div className="rounded-2xl px-5 py-4 text-center border border-[#E5E7EB]"
          style={{
            background: "#FAFAFA",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
          <p className="text-[9px] font-bold text-[#9CA3AF] tracking-[0.18em] uppercase mb-2.5">핵심 갈등</p>
          <div className="flex flex-wrap justify-center gap-2">
            {diagramKeywords.coreConflict.map((kw) => (
              <span key={kw}
                className="px-3.5 py-1.5 bg-white rounded-full text-[13px] font-semibold"
                style={{ color: "#D95A78", border: "1.5px solid #D95A7860" }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2×2 FEIN 노드 */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {CATEGORIES.map((cat, idx) => {
          const catId    = cat.id as FeinCatId;
          const Icon     = cat.icon;
          const isInterp = catId === "interpretations";

          return (
            <motion.div
              key={cat.id}
              ref={(el) => { nodeRefs.current[idx] = el; }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + idx * 0.07, type: "spring", stiffness: 260, damping: 24 }}
              className="bg-white rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: `${cat.color}50`, boxShadow: `0 1px 8px ${cat.color}10` }}
            >
              {/* 카드 헤더 */}
              <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0 bg-white"
                style={{ borderBottom: `1px solid ${cat.color}30` }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}>
                  <Icon size={10} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: cat.color }}>
                  {cat.label}
                </span>
                <span className="ml-auto text-[8px] font-semibold opacity-45 tracking-wide" style={{ color: cat.color }}>
                  {cat.en}
                </span>
              </div>

              {/* 시각화 */}
              {isInterp ? (
                <FeinNodeInterp branches={mindmapData.interpretationBranches} aLabel={aName} bLabel={bName} pick={pick} sel={sel} myRole={myRole} />
              ) : (
                <FeinNodeVenn catData={getMmCat(catId)} cat={cat} aLabel={aName} bLabel={bName} pick={pick} sel={sel} myRole={myRole} />
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-[#B0B0BA] mt-3 tracking-wide">
        키워드를 탭하면 원문을 확인할 수 있어요
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Fixed Tooltip
═══════════════════════════════════════════════ */
function FixedTooltip({ node, myRole, onClose }: {
  node: SelectedNode; myRole?: "A" | "B" | null; onClose: () => void;
}) {
  const w = 272, margin = 12;
  const cx = node.rect.left + node.rect.width / 2;
  const left = Math.max(margin, Math.min(cx - w / 2, window.innerWidth - w - margin));
  const below = window.innerHeight - node.rect.bottom > 160;
  const top = below ? node.rect.bottom + 8 : node.rect.top - 8;

  // 본인 키워드만 원문 표시. 공통(shared)·상대방 키워드는 원문 숨김.
  const canSeeSource =
    !myRole ||
    (node.side === "A" && myRole === "A") ||
    (node.side === "B" && myRole === "B");

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: below ? -4 : 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", left, top, width: w, zIndex: 99999, transform: below ? "none" : "translateY(-100%)" }}
      className="pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl p-4 border border-white/10 relative overflow-hidden"
           style={{ background: "#17161F", boxShadow: "0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)" }}>
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-3 pr-6">
          <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
            <Quote size={10} className="text-white/50" strokeWidth={3} />
          </div>
          <p className="text-[11px] font-semibold text-white/50">
            {node.sourceKind === "input" ? "입력된 원문" : "AI 분석 문장"}
          </p>
          {node.confidence > 0 && (
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#FFD0DA22", color: "#FF8FAA" }}>
              {Math.min(node.confidence, 99)}%
            </span>
          )}
        </div>
        {canSeeSource && (
          <p className="text-[13px] text-white/85 leading-relaxed break-keep">
            "{node.sourceText}"
          </p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-white/70 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}

/* ═══════════════════════════════════════════════
   Keyword Button
═══════════════════════════════════════════════ */
function KwBtn({
  item, className, style, onSelect, isSelected,
}: {
  item: KeywordItem; className?: string; style?: React.CSSProperties;
  onSelect: (item: KeywordItem, rect: DOMRect) => void; isSelected: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(item, e.currentTarget.getBoundingClientRect()); }}
      style={style}
      className={`${className ?? ""} ${isSelected ? "ring-2 ring-offset-1 ring-[#C9485B]/40" : ""} transition-all active:scale-95`}
    >
      {item.text}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   Tension Card (갈등 포인트)
═══════════════════════════════════════════════ */
function TensionCard({
  tension, aName, bName,
}: { tension: DualAnalysisResult["tensions"][number]; aName: string; bName: string }) {
  const style = TENSION_STYLES[tension.type] ?? { color: "#636366", bg: "#F5F5F7" };
  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEF] overflow-hidden"
         style={{ boxShadow: CARD_SHADOW }}>
      {/* 상단 — 유형 칩 */}
      <div className="px-4 pt-4 pb-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: style.bg }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: style.color }} />
          <span className="text-[11px] font-bold" style={{ color: style.color }}>
            {tension.displayName ?? tension.type}
          </span>
        </span>
      </div>

      {/* 분석 텍스트 */}
      <p className="px-4 pb-3.5 text-[13px] text-[#3A3A42] leading-[1.85] break-keep">
        {tension.rationale}
      </p>

      {/* 관련 발화자 */}
      {tension.evidence.length > 0 && (
        <div className="px-4 pb-3.5 pt-2 flex flex-wrap gap-1.5 border-t border-[#F2F2F5]">
          {Array.from(new Set(tension.evidence.map((ev) => ev.speaker))).map((speaker) => {
            const isA = speaker === "A";
            const name = isA ? aName : bName;
            const color = isA ? A_COLOR : B_COLOR;
            const bg = isA ? A_LIGHT : B_LIGHT;
            return (
              <span key={speaker}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: bg, color }}>
                <span className="w-3 h-3 rounded-full flex items-center justify-center font-bold text-[7px]"
                      style={{ backgroundColor: `${color}30` }}>
                  {name.charAt(0)}
                </span>
                {name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   상대방의 언어로 듣기
═══════════════════════════════════════════════ */
function PerspectiveSection({
  sections, aName, bName,
}: {
  sections: LlmResult["sections"];
  aName: string; bName: string;
}) {
  const aText = [sections.emotions?.a, sections.needs?.a].filter(Boolean).join(" ");
  const bText = [sections.emotions?.b, sections.needs?.b].filter(Boolean).join(" ");
  if (!aText && !bText) return null;

  const cards = [
    aText ? { from: aName, to: bName, text: aText, color: A_COLOR, light: A_LIGHT } : null,
    bText ? { from: bName, to: aName, text: bText, color: B_COLOR, light: B_LIGHT } : null,
  ].filter(Boolean) as Array<{ from: string; to: string; text: string; color: string; light: string }>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
      className="px-4 sm:px-5 pb-5"
    >
      <SectionLabel label="상대방의 언어로 듣기" icon={MessageSquare} color="#8B8BA0" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {cards.map(({ from, to, text, color, light }) => (
          <div key={from}
               className="bg-white rounded-2xl border border-[#EAEAEF] overflow-hidden"
               style={{ boxShadow: CARD_SHADOW }}>
            {/* 상단 컬러 스트라이프 헤더 */}
            <div className="px-4 py-3 border-b border-[#F2F2F5]"
                 style={{ background: `${light}` }}>
              <p className="text-[12.5px] font-bold leading-snug" style={{ color }}>
                {to}에게 전하는
                <span className="ml-1 font-black">{from}</span>의 진짜 마음
              </p>
            </div>
            <p className="px-4 py-4 text-[13.5px] text-[#38383F] leading-[1.9] break-keep">
              {text}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   상세 분석
═══════════════════════════════════════════════ */
function DetailAnalysisSection({
  sections, aName, bName,
}: {
  sections: LlmResult["sections"];
  aName: string; bName: string;
}) {
  const hasContent = CATEGORIES.some((cat) => {
    const catId = cat.id as FeinCatId;
    return sections[catId]?.a || sections[catId]?.b;
  });
  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
      className="px-4 sm:px-5 pb-5"
    >
      <SectionLabel label="상세 분석" icon={AlignLeft} color="#8B8BA0" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {CATEGORIES.map((cat) => {
          const catId = cat.id as FeinCatId;
          const aText = sections[catId]?.a ?? "";
          const bText = sections[catId]?.b ?? "";
          if (!aText && !bText) return null;
          const Icon = cat.icon;
          return (
            <div key={cat.id}
                 className="bg-white rounded-2xl border overflow-hidden"
                 style={{ borderColor: `${cat.color}22`, boxShadow: CARD_SHADOW }}>
              {/* 카테고리 헤더 */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                   style={{ background: cat.bg, borderColor: `${cat.color}18` }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>
                  <Icon size={10} strokeWidth={2.5} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                <span className="text-[9.5px] opacity-40 ml-0.5 font-medium" style={{ color: cat.color }}>{cat.en}</span>
              </div>

              {/* A / B 분석 텍스트 */}
              <div className="divide-y divide-[#F5F5F8]">
                {aText && (
                  <div className="flex gap-3 px-4 py-3.5 items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                         style={{ background: A_LIGHT, color: A_COLOR }}>
                      {aName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold mb-1" style={{ color: A_COLOR }}>{aName}</p>
                      <p className="text-[13px] text-[#3A3A42] leading-relaxed break-keep">{aText}</p>
                    </div>
                  </div>
                )}
                {bText && (
                  <div className="flex gap-3 px-4 py-3.5 items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                         style={{ background: B_LIGHT, color: B_COLOR }}>
                      {bName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold mb-1" style={{ color: B_COLOR }}>{bName}</p>
                      <p className="text-[13px] text-[#3A3A42] leading-relaxed break-keep">{bText}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Insights Section (갈등 포인트)
═══════════════════════════════════════════════ */
const BAD_RATIONALE_PATTERNS = [
  "정렬되지 않은", "statement가 남아", "처리할 수 없", "오류가 발생", "알 수 없는",
  "분류되지 않", "매핑 실패", "null", "undefined",
];
function isValidTension(t: DualAnalysisResult["tensions"][number]) {
  if (!t.rationale || t.rationale.trim().length < 10) return false;
  return !BAD_RATIONALE_PATTERNS.some((p) => t.rationale.includes(p));
}

function InsightsSection({
  dualResult, aName, bName,
}: { dualResult: DualAnalysisResult; aName: string; bName: string }) {
  const validTensions = dualResult.tensions.filter(isValidTension);
  if (validTensions.length === 0) return null;

  return (
    <div className="px-4 sm:px-5 mb-6">
      <SectionLabel label="갈등 포인트" icon={Target} color="#DC4C4C" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {validTensions.map((t) => (
          <TensionCard key={t.id} tension={t} aName={aName} bName={bName} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Dashboard Page
═══════════════════════════════════════════════ */
export function DashboardPage() {
  const navigate = useNavigate();
  const [llmResult, setLlmResult]           = useState<LlmResult | null>(null);
  const [dualResult, setDualResult]         = useState<DualAnalysisResult | null>(null);
  const [evidenceResult, setEvidenceResult] = useState<LlmEvidenceResult | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);
  const [personNames, setPersonNames]       = useState({ a: "A", b: "B" });
  const [relationship, setRelationship]     = useState("");
  const [myRole, setMyRole]                 = useState<"A" | "B" | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisData");
    if (!stored) {
      setErrorMsg("분석 데이터가 없습니다. 홈으로 돌아가 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }
    let parsed: { sessionId?: string; personA?: { name: string }; personB?: { name: string }; myRole?: "A" | "B" };
    try { parsed = JSON.parse(stored); }
    catch {
      setErrorMsg("분석 데이터가 손상되었습니다.");
      setIsLoading(false);
      return;
    }
    if (parsed.personA?.name || parsed.personB?.name) {
      setPersonNames({
        a: parsed.personA?.name || "A",
        b: parsed.personB?.name || "B",
      });
    }
    if (parsed.myRole === "A" || parsed.myRole === "B") setMyRole(parsed.myRole);

    const sessionId = parsed.sessionId;
    if (!sessionId) {
      setErrorMsg("세션 정보가 없습니다. 백엔드 연동 후 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    const roomRaw = localStorage.getItem(`room_${sessionId}`);
    if (roomRaw) {
      try { setRelationship(JSON.parse(roomRaw).relationship ?? ""); } catch { /* ignore */ }
    }

    const handleLoadedLlm = (result: LlmResult) => {
      setLlmResult(result);
      Promise.all([
        api.getDualResults(sessionId).catch(() => null),
        api.getLlmEvidence(sessionId).catch(() => null),
      ]).then(([dual, evidence]) => {
        setDualResult(dual);
        setEvidenceResult(evidence);
        // API 응답에서 참여자 이름 반영 (sessionStorage보다 우선)
        // 백엔드 API 응답의 participants로 이름 설정 (가장 정확)
        if (dual?.participants?.length) {
          const a = dual.participants.find((p) => p.role === "A");
          const b = dual.participants.find((p) => p.role === "B");
          setPersonNames({
            a: a?.name || "A",
            b: b?.name || "B",
          });
        }
      }).finally(() => setIsLoading(false));
    };

    const tryLoad = (retryCount = 0) => {
      api.getLlmAnalysis(sessionId)
        .then(handleLoadedLlm)
        .catch((err: ApiError) => {
          if (err.code === "LLM_RESULT_NOT_FOUND") {
            api.generateLlmAnalysis(sessionId)
              .then(handleLoadedLlm)
              .catch((genErr: ApiError) => {
                if (genErr.code === "ANALYSIS_NOT_READY" && retryCount < 10) {
                  setTimeout(() => tryLoad(retryCount + 1), 2000);
                } else {
                  setErrorMsg(genErr.message ?? "LLM 분석 생성에 실패했습니다.");
                  setIsLoading(false);
                }
              });
          } else {
            setErrorMsg(err.message ?? "분석 결과를 불러오지 못했습니다.");
            setIsLoading(false);
          }
        });
    };
    tryLoad();
  }, []);

  /* ── Header ── */
  const header = (
    <header
      className="px-4 h-14 flex items-center justify-between sticky top-0 z-[500]"
      style={{
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <button
        onClick={() => navigate("/home")}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/05 active:scale-95"
        style={{ color: "#636370" }}
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <p className="text-[14px] font-bold text-[#1C1C1E] tracking-tight">분석 결과</p>
      <div className="w-8" />
    </header>
  );

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#F5F5F7" }}>
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  /* ── Error ── */
  if (errorMsg || !llmResult) {
    return (
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#F5F5F7" }}>
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
               style={{ background: "#FFF0F3" }}>
            <AlertCircle size={26} style={{ color: A_COLOR }} />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-bold text-[#1C1C1E] mb-1.5">결과를 불러올 수 없어요</p>
            <p className="text-[13.5px] text-[#636370] leading-relaxed">{errorMsg}</p>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="mt-1 px-6 h-11 rounded-2xl font-semibold text-[14px] active:scale-[0.98] transition-all"
            style={{ background: A_LIGHT, color: A_COLOR }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { sections, diagramKeywords, resultText } = llmResult;
  const { a: aName, b: bName } = personNames;
  const date = new Date(llmResult.createdAt)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".").replace(/\.$/, "");
  const mindmapData = buildMindmapData({ llmResult, aName, bName, relationship, date, evidenceResult });

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#F0F0F4" }}>
      {header}

      <div className="flex-1 overflow-y-auto pb-16 w-full max-w-[1120px] mx-auto">

        {/* ━━━━━━ 히어로 배너 ━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(150deg, #FFF0F4 0%, #F8F5FF 55%, #EFF2FF 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* 배경 장식 — 컬러 블롭 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full"
                 style={{ background: `radial-gradient(circle, ${A_COLOR}22, transparent 70%)` }} />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full"
                 style={{ background: `radial-gradient(circle, ${B_COLOR}1A, transparent 70%)` }} />
          </div>

          <div className="relative px-5 pt-6 pb-7">
            {/* 날짜 · 관계 배지 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(0,0,0,0.06)", color: "#52525B" }}>
                {date}
              </span>
              {relationship && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: "rgba(0,0,0,0.05)", color: "#52525B" }}>
                  {relationship}
                </span>
              )}
            </div>

            {/* 갈등 제목 */}
            {diagramKeywords.coreConflict[0] && (
              <p className="text-[22px] font-black tracking-tight leading-tight mb-6"
                 style={{ color: "#18181B" }}>
                {diagramKeywords.coreConflict[0]}
              </p>
            )}

            {/* A vs B 구도 */}
            <div className="flex items-center gap-3">
              {/* A */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[16px] flex-shrink-0"
                     style={{ background: A_LIGHT, color: A_COLOR, border: `1.5px solid ${A_COLOR}30` }}>
                  {aName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold truncate" style={{ color: "#18181B" }}>{aName}</p>
                  <p className="text-[10px] font-semibold" style={{ color: A_COLOR }}>주체 A</p>
                </div>
              </div>

              {/* vs */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1 px-1">
                <div className="w-px h-2.5" style={{ background: "#D4D4D8" }} />
                <span className="text-[9px] font-black tracking-widest" style={{ color: "#A1A1AA" }}>VS</span>
                <div className="w-px h-2.5" style={{ background: "#D4D4D8" }} />
              </div>

              {/* B */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                <div className="min-w-0 text-right">
                  <p className="text-[14px] font-bold truncate" style={{ color: "#18181B" }}>{bName}</p>
                  <p className="text-[10px] font-semibold" style={{ color: B_COLOR }}>주체 B</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[16px] flex-shrink-0"
                     style={{ background: B_LIGHT, color: B_COLOR, border: `1.5px solid ${B_COLOR}30` }}>
                  {bName.charAt(0)}
                </div>
              </div>
            </div>

            {/* 서브텍스트 */}
            <p className="mt-4 text-[12px] leading-relaxed" style={{ color: "#A1A1AA" }}>
              AI가 두 분의 관점을 분석하여 갈등 구조를 정리했어요.
            </p>
          </div>
        </motion.div>

        {/* ━━━━━━ 컨텐츠 영역 ━━━━━━ */}
        <div className="space-y-px">

          {/* FEIN 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-white px-4 sm:px-5 pt-6 pb-6"
          >
            <SectionLabel label="FEIN 분석" icon={Sparkles} color="#C9485B" />
            <FeinDiagram
              llmResult={llmResult} aName={aName} bName={bName}
              myRole={myRole} mindmapData={mindmapData}
            />
          </motion.div>

          {/* AI 종합 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-white px-4 sm:px-5 pt-6 pb-6"
          >
            <SectionLabel label="AI 종합 분석" icon={Wand2} color="#C9485B" />

            {/* 메인 텍스트 카드 */}
            <div className="relative rounded-2xl border border-[#EAEAEF] overflow-hidden"
                 style={{ background: "#FAFAFA", boxShadow: CARD_SHADOW }}>
              {/* 장식 따옴표 */}
              <div className="absolute top-3 left-4 text-[56px] font-black leading-none select-none pointer-events-none"
                   style={{ color: "#F2F2F4", fontFamily: "Georgia, serif" }}>
                "
              </div>
              <p className="relative px-5 pt-8 pb-5 text-[13.5px] text-[#38383F] leading-[1.9] break-keep whitespace-pre-wrap">
                {resultText}
              </p>
            </div>

          </motion.div>

          {/* 상대방의 언어로 듣기 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="bg-white pt-6 pb-1"
          >
            <PerspectiveSection sections={sections} aName={aName} bName={bName} />
          </motion.div>

          {/* 상세 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white pt-6 pb-1"
          >
            <DetailAnalysisSection sections={sections} aName={aName} bName={bName} />
          </motion.div>

          {/* 갈등 포인트 */}
          {dualResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="bg-white pt-6 pb-1"
            >
              <InsightsSection dualResult={dualResult} aName={aName} bName={bName} />
            </motion.div>
          )}

          {/* 함께 생각해볼 질문 */}
          {sections.questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}
              className="bg-white px-4 sm:px-5 pt-6 pb-8"
            >
              <SectionLabel label="함께 생각해볼 질문" icon={HelpCircle} color="#8B8BA0" />
              <div className="space-y-2.5">
                {sections.questions.map((q, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="flex gap-3.5 items-start rounded-2xl p-4 border border-[#EAEAEF]"
                    style={{ background: "#FAFAFA", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5"
                         style={{ background: "#FFF0F3", color: A_COLOR }}>
                      {i + 1}
                    </div>
                    <p className="text-[13.5px] text-[#4A4A55] leading-relaxed break-keep flex-1">{q}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
