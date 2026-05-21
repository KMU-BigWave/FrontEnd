import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Home,
  ListChecks,
  BrainCircuit,
  HeartPulse,
  Send,
  HelpCircle,
  Target,
  X,
  Quote,
  Wand2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  api,
  type ApiError,
  type LlmResult,
  type DualAnalysisResult,
  type LlmEvidenceResult,
} from "../utils/api";

interface KeywordItem {
  text: string;
  sourceText: string;
  confidence: number;
  sourceKind: "input" | "analysis";
}
interface SelectedNode extends KeywordItem { rect: DOMRect; }

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
  conflictPeak: {
    type: "",
    category: "",
    description: "",
  },
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
  { id: "facts" as const, label: "사실", en: "Fact", icon: ListChecks, color: "#818CF8", bg: "#EEF2FF" },
  { id: "interpretations" as const, label: "해석", en: "Interpret", icon: BrainCircuit, color: "#F0A858", bg: "#FEF6E8" },
  { id: "emotions" as const, label: "감정", en: "Emotion", icon: HeartPulse, color: "#E88FA0", bg: "#FDF2F4" },
  { id: "needs" as const, label: "요구", en: "Need", icon: Send, color: "#5BB89A", bg: "#E8F6F0" },
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

function shortenForChip(text: string, max = 14) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function makeKeyword(text: string, sourceText = text, sourceKind: KeywordItem["sourceKind"] = "analysis"): KeywordItem {
  return {
    text: shortenForChip(text),
    sourceText,
    sourceKind,
    confidence: 0,
  };
}

function makeMindmapGroup(
  section: { a?: string; b?: string } | undefined,
  keywords: string[] | undefined,
  sectionEvidence?: KeywordEvidenceEntry[],
) {
  const evidenceMap = new Map(
    (sectionEvidence ?? []).map(({ keyword, evidence }) => [keyword, evidence[0] ?? null])
  );

  const makeKwWithEvidence = (text: string, sourceText = text): KeywordItem => {
    const ev = evidenceMap.get(text);
    return {
      text: shortenForChip(text),
      sourceText: ev?.text ?? sourceText,
      sourceKind: ev?.text ? "input" : "analysis",
      confidence: ev?.confidencePercent ?? 0,
    };
  };

  return {
    shared: (keywords ?? []).slice(0, 3).map((k) => makeKwWithEvidence(k)),
    meOnly: section?.a ? [makeKeyword(section.a)] : [],
    partnerOnly: section?.b ? [makeKeyword(section.b)] : [],
  };
}

function buildMindmapData({
  llmResult,
  aName,
  bName,
  relationship,
  date,
  evidenceResult,
}: {
  llmResult: LlmResult;
  aName: string;
  bName: string;
  relationship: string;
  date: string;
  evidenceResult: LlmEvidenceResult | null;
}): DashboardData {
  const { sections, diagramKeywords, resultText } = llmResult;
  const ev = evidenceResult?.keywordEvidence;

  const firstFact = diagramKeywords.facts[0] || sections.facts.a || sections.facts.b || "";
  const factKeywordEvidence = ev?.facts?.find(({ keyword }) => keyword === firstFact)?.evidence[0] ?? null;
  const interpretationBranch =
    firstFact && (sections.interpretations.a || sections.interpretations.b)
      ? [{
          id: "api-interpretation",
          fact: makeKeyword(
            firstFact,
            factKeywordEvidence?.text ?? sections.facts.a ?? sections.facts.b ?? firstFact,
            factKeywordEvidence?.text ? "input" : "analysis",
          ),
          me: sections.interpretations.a ? [makeKeyword(sections.interpretations.a)] : [],
          partner: sections.interpretations.b ? [makeKeyword(sections.interpretations.b)] : [],
        }]
      : [];

  return {
    title: diagramKeywords.coreConflict[0] || "분석 결과",
    date,
    relationship,
    me: { name: aName },
    partner: { name: bName },
    mindmap: {
      fact: makeMindmapGroup(sections.facts, diagramKeywords.facts, ev?.facts),
      interpretation: makeMindmapGroup(sections.interpretations, diagramKeywords.interpretations, ev?.interpretations),
      emotion: makeMindmapGroup(sections.emotions, diagramKeywords.emotions, ev?.emotions),
      request: makeMindmapGroup(sections.needs, diagramKeywords.needs, ev?.needs),
    },
    interpretationBranches: interpretationBranch,
    conflictPeak: {
      type: "",
      category: "",
      description: "",
    },
    aiRestatements: {
      fact: { me: sections.facts.a || "", partner: sections.facts.b || "" },
      interpretation: { me: sections.interpretations.a || "", partner: sections.interpretations.b || "" },
      emotion: { me: sections.emotions.a || "", partner: sections.emotions.b || "" },
      request: { me: sections.needs.a || "", partner: sections.needs.b || "" },
    },
    aiSummaryAndRestatement: {
      neutralSummary: resultText,
      aFromBPerspective: sections.interpretations.b || sections.emotions.b || "",
      bFromAPerspective: sections.interpretations.a || sections.emotions.a || "",
      confidence: 0,
    },
    clarifyingQuestions: sections.questions,
  };
}

/* ── Portal Tooltip ── */
function FixedTooltip({ node, onClose }: { node: SelectedNode; onClose: () => void }) {
  const w = 272, margin = 12;
  const cx = node.rect.left + node.rect.width / 2;
  let left = Math.max(margin, Math.min(cx - w / 2, window.innerWidth - w - margin));
  const below = window.innerHeight - node.rect.bottom > 160;
  const top = below ? node.rect.bottom + 8 : node.rect.top - 8;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.14 }}
      style={{ position: "fixed", left, top, width: w, zIndex: 99999, transform: below ? "none" : "translateY(-100%)" }}
      className="pointer-events-auto" onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#1C1C1E] text-white rounded-2xl p-4 shadow-2xl border border-white/10 relative">
        <div className="flex items-center justify-between mb-2.5 pr-6">
          <div className="flex items-center gap-1.5">
            <Quote size={11} className="text-[#ffd1da]" strokeWidth={3} />
            <p className="font-semibold text-[11.5px] text-white/70">
              {node.sourceKind === "input" ? "입력된 원문" : "AI 분석 문장"}
            </p>
          </div>
          {node.confidence > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#ffd1da]/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
              <span className="text-[10.5px] font-semibold text-[#ffd1da]">신뢰도 {Math.min(node.confidence, 99)}%</span>
            </div>
          )}
        </div>
        <p className="text-[12.5px] text-white/90 leading-relaxed break-keep">"{node.sourceText}"</p>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>,
    document.body
  );
}

/* ── Keyword Button ── */
function KwBtn({ item, className, style, onSelect, isSelected }: {
  item: KeywordItem; className?: string; style?: React.CSSProperties;
  onSelect: (item: KeywordItem, rect: DOMRect) => void; isSelected: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(item, e.currentTarget.getBoundingClientRect()); }}
      style={style}
      className={`${className ?? ""} ${isSelected ? "ring-2 ring-[#ffd1da]/70 ring-offset-1" : ""} transition-all active:scale-95`}
    >
      {item.text}
    </button>
  );
}

/* ── VennCard ── */
function VennCard({ catData, cat, data, pick, sel }: {
  catData: { meOnly: KeywordItem[]; shared: KeywordItem[]; partnerOnly: KeywordItem[] };
  cat: { id: string; label: string; en: string; color: string; bg: string };
  data: DashboardData;
  pick: (item: KeywordItem, rect: DOMRect) => void;
  sel: SelectedNode | null;
}) {
  return (
    <TabsContent value={cat.id} className="mt-0 outline-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-[#EBEBF0] overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F5F5F7]">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
          <span className="text-[13px] font-bold text-[#1C1C1E]">{cat.label}</span>
          <span className="text-[11px]" style={{ color: cat.color }}>{cat.en}</span>
        </div>

        {/* ── Venn body: px-3 so circles stay large but have a little card-edge gap ── */}
        <div className="px-3 pt-3 pb-4">

          <div className="flex items-center mb-2 mx-auto" style={{ maxWidth: 720 }}>
            <div className="flex-[3] flex justify-center">
              <span className="text-[11px] font-bold" style={{ color: "#f07090" }}>{data.me.name}</span>
            </div>
            <div className="flex-[2] flex justify-center">
              <span className="text-[10px] text-[#C7C7CC]">공통</span>
            </div>
            <div className="flex-[3] flex justify-center">
              <span className="text-[11px] font-bold" style={{ color: "#7b87ff" }}>{data.partner.name}</span>
            </div>
          </div>

          <div
            className="relative w-full mx-auto"
            style={{ maxWidth: 720, aspectRatio: "8 / 5", containerType: "inline-size" }}
          >

            {/* Left circle */}
            <div style={{
              position: "absolute", left: "0%", top: "50%",
              width: "62.5%", aspectRatio: "1 / 1",
              transform: "translateY(-50%)", borderRadius: "50%",
              border: "1.5px solid rgba(255,140,160,0.55)",
              background: "rgba(255,222,230,0.45)",
              pointerEvents: "none", zIndex: 0,
            }} />

            {/* Right circle */}
            <div style={{
              position: "absolute", right: "0%", top: "50%",
              width: "62.5%", aspectRatio: "1 / 1",
              transform: "translateY(-50%)", borderRadius: "50%",
              border: "1.5px solid rgba(110,120,255,0.55)",
              background: "rgba(210,215,255,0.45)",
              pointerEvents: "none", zIndex: 0,
            }} />

            <div className="absolute inset-0 flex items-stretch z-10"
                 style={{ paddingTop: 6, paddingBottom: 6 }}>

              {/* Left — me only */}
              <div className="flex-[3] flex flex-col items-center justify-center gap-2"
                   style={{ paddingInline: "8px 5px" }}>
                {catData.meOnly.map((item, i) => (
                  <KwBtn key={`me-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                    className="w-fit max-w-full px-2.5 py-1.5 bg-white border border-pink-200 rounded-xl font-medium text-[#222] text-center break-keep leading-snug hover:border-pink-400 hover:bg-pink-50/40 transition-colors"
                    style={{ fontSize: "calc(0.532cqw + 7.667px)" }} />
                ))}
              </div>

              {/* Center — shared */}
              <div className="flex-[2] flex flex-col items-center justify-center gap-2"
                   style={{ paddingInline: "3px" }}>
                {catData.shared.length === 0 ? (
                  <span className="text-[#D1D1D6] text-center leading-snug"
                    style={{ fontSize: "calc(0.417cqw + 6px)" }}>공통<br/>없음</span>
                ) : catData.shared.map((item, i) => (
                  <KwBtn key={`sh-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                    className="w-fit max-w-full px-2 py-1.5 rounded-xl font-bold text-white text-center break-keep leading-snug hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: cat.color, fontSize: "calc(0.463cqw + 6.667px)" }} />
                ))}
              </div>

              {/* Right — partner only */}
              <div className="flex-[3] flex flex-col items-center justify-center gap-2"
                   style={{ paddingInline: "5px 8px" }}>
                {catData.partnerOnly.map((item, i) => (
                  <KwBtn key={`pt-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                    className="w-fit max-w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-xl font-medium text-[#222] text-center break-keep leading-snug hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
                    style={{ fontSize: "calc(0.532cqw + 7.667px)" }} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </TabsContent>
  );
}

/* ── Mindmap Visualization ── */
function MindmapVisualization({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState("facts");
  const [sel, setSel] = useState<SelectedNode | null>(null);

  const pick = (item: KeywordItem, rect: DOMRect) => setSel(sel?.text === item.text ? null : { ...item, rect });

  useEffect(() => {
    const dismiss = () => setSel(null);
    document.addEventListener("click", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => { document.removeEventListener("click", dismiss); window.removeEventListener("scroll", dismiss, true); };
  }, []);
  useEffect(() => { setSel(null); }, [activeTab]);

  return (
    <div className="px-4 sm:px-5 py-5">
      <AnimatePresence>{sel && <FixedTooltip node={sel} onClose={() => setSel(null)} />}</AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto bg-transparent border-b border-[#EBEBF0] rounded-none p-0 mb-5 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}
              className="px-4 py-3 rounded-none border-b-2 font-semibold text-[13.5px] whitespace-nowrap -mb-[1px] data-[state=active]:text-[#1C1C1E] data-[state=inactive]:border-transparent data-[state=inactive]:text-[#AEAEB2]"
              style={{ borderColor: activeTab === cat.id ? cat.color : "transparent" }}>
              {cat.label} {cat.en}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => {
          /* Interpretation tab — tree view */
          if (cat.id === "interpretations") {
            return (
              <TabsContent key={cat.id} value={cat.id} className="mt-0 outline-none">
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                  className="w-full py-8 px-4 flex flex-col items-center bg-white rounded-2xl border border-[#EBEBF0]">
                  <div className="mb-5 px-3 py-1 rounded-full text-[11.5px] font-semibold" style={{ backgroundColor: cat.bg, color: cat.color }}>
                    같은 사실, 다른 해석
                  </div>
                  <div className="w-full flex flex-col items-center gap-12">
                    {data.interpretationBranches.map((branch, idx) => (
                      <div key={branch.id} className="w-full max-w-[340px] flex flex-col items-center">
                        <KwBtn item={branch.fact} onSelect={pick} isSelected={sel?.text === branch.fact.text}
                          className="px-4 py-2.5 bg-[#fff5f7] border border-[#ffd1da] rounded-xl text-[13px] font-semibold text-[#c9485b] hover:scale-[1.02] text-center break-keep" />
                        <div className="relative w-full h-10 flex justify-center pointer-events-none">
                          <div className="w-[2px] h-5 bg-[#E5E5EA]" />
                          <div className="absolute top-5 w-[76%] h-[2px] bg-[#E5E5EA]" />
                          <div className="absolute top-5 left-[12%] w-[2px] h-5 bg-[#E5E5EA]" />
                          <div className="absolute top-5 right-[12%] w-[2px] h-5 bg-[#E5E5EA]" />
                        </div>
                        <div className="w-full flex justify-between mt-[-2px]">
                          <div className="w-[48%] flex flex-col items-center gap-2.5">
                            {idx === 0 && (
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-4 h-4 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center font-bold text-[9px]">{data.me.name.charAt(0)}</div>
                                <span className="text-[11px] font-semibold text-[#636366]">{data.me.name}의 시각</span>
                              </div>
                            )}
                            {branch.me.map((item, i) => (
                              <KwBtn key={`me-${branch.id}-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                                className="w-full px-3 py-2.5 bg-white border border-pink-100 rounded-2xl text-[12px] font-medium text-[#1C1C1E] text-center leading-snug break-keep hover:border-pink-300 hover:bg-pink-50/30" />
                            ))}
                          </div>
                          <div className="w-[48%] flex flex-col items-center gap-2.5">
                            {idx === 0 && (
                              <div className="flex items-center gap-1 mb-1 justify-end">
                                <span className="text-[11px] font-semibold text-[#636366]">{data.partner.name}의 시각</span>
                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-[9px]">{data.partner.name.charAt(0)}</div>
                              </div>
                            )}
                            {branch.partner.map((item, i) => (
                              <KwBtn key={`partner-${branch.id}-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                                className="w-full px-3 py-2.5 bg-white border border-indigo-100 rounded-2xl text-[12px] font-medium text-[#1C1C1E] text-center leading-snug break-keep hover:border-indigo-300 hover:bg-indigo-50/30" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            );
          }

          /* Venn diagram tabs */
          const catData = data.mindmap[MINDMAP_KEY_BY_CATEGORY[cat.id]];
          return (
            <VennCard key={cat.id} catData={catData} cat={cat} data={data} pick={pick} sel={sel} />
          );
        })}
      </Tabs>
    </div>
  );
}

/* ── Category Detail Card ── */
function CategoryCard({ cat, aName, bName, aText, bText, keywords }: {
  cat: typeof CATEGORIES[number];
  aName: string; bName: string;
  aText: string; bText: string;
  keywords: string[];
}) {
  const Icon = cat.icon;
  return (
    <motion.div
      key={cat.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-[#EBEBF0] overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#F5F5F7]">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg, color: cat.color }}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <span className="text-[13.5px] font-bold text-[#1C1C1E]">{cat.label}</span>
        <span className="text-[11px]" style={{ color: cat.color }}>{cat.en}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-[10px] flex-shrink-0 mt-0.5">
            {aName.charAt(0)}
          </div>
          <div className="flex-1 bg-[#F5F5F7] rounded-xl rounded-tl-sm p-3.5" style={{ borderLeft: `3px solid ${cat.color}40` }}>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: cat.color }}>{aName}의 {cat.label}</p>
            <p className="text-[13px] text-[#3f3f3f] leading-relaxed break-keep">{aText || "분석 내용 없음"}</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-[10px] flex-shrink-0 mt-0.5">
            {bName.charAt(0)}
          </div>
          <div className="flex-1 bg-[#F5F5F7] rounded-xl rounded-tl-sm p-3.5" style={{ borderLeft: `3px solid ${cat.color}40` }}>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: cat.color }}>{bName}의 {cat.label}</p>
            <p className="text-[13px] text-[#3f3f3f] leading-relaxed break-keep">{bText || "분석 내용 없음"}</p>
          </div>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {keywords.map((kw) => (
              <span key={kw} className="px-2.5 py-1 rounded-full text-[11.5px] font-medium"
                style={{ backgroundColor: cat.bg, color: cat.color }}>
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const TENSION_STYLES: Record<string, { color: string; bg: string }> = {
  FACT_CONFLICT:      { color: "#E55050", bg: "#FEF2F2" },
  PERSPECTIVE_GAP:    { color: "#F0A858", bg: "#FEF6E8" },
  EMOTION_NEED_GAP:   { color: "#E88FA0", bg: "#FDF2F4" },
  LABEL_MISMATCH:     { color: "#818CF8", bg: "#EEF2FF" },
  UNADDRESSED_NEEDS:  { color: "#5BB89A", bg: "#E8F6F0" },
  INTERPRETATION_GAP: { color: "#A78BFA", bg: "#F5F3FF" },
};

const PAIR_STYLES: Record<string, { color: string; bg: string }> = {
  COMMON_FACT:              { color: "#818CF8", bg: "#EEF2FF" },
  SHARED_EMOTION:           { color: "#E88FA0", bg: "#FDF2F4" },
  INTERPRETATION_ALIGNMENT: { color: "#F0A858", bg: "#FEF6E8" },
  NEED_ALIGNMENT:           { color: "#5BB89A", bg: "#E8F6F0" },
};

function TensionCard({ tension, aName, bName }: {
  tension: DualAnalysisResult["tensions"][number];
  aName: string;
  bName: string;
}) {
  const style = TENSION_STYLES[tension.type] ?? { color: "#636366", bg: "#F5F5F7" };
  return (
    <div className="bg-white rounded-2xl border border-[#EBEBF0] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#F5F5F7]">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: style.color }} />
        <span className="text-[13.5px] font-bold text-[#1C1C1E]">{tension.displayName ?? tension.type}</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-[13px] text-[#636366] leading-relaxed break-keep">{tension.rationale}</p>
        {tension.evidence.length > 0 && (
          <div className="space-y-2 pt-1">
            {tension.evidence.map((ev, i) => {
              const isA = ev.speaker === "A";
              const name = isA ? aName : bName;
              const color = isA ? "#f07090" : "#7b87ff";
              const bgCls = isA ? "bg-pink-50 border-pink-100" : "bg-indigo-50 border-indigo-100";
              const confidencePct = ev.confidence != null ? Math.min(Math.round(ev.confidence * 100), 99) : null;
              return (
                <div key={i} className={`flex gap-2.5 rounded-xl p-3 border ${bgCls}`}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: color + "33", color }}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold mb-1" style={{ color }}>{name}</p>
                    <p className="text-[12.5px] text-[#3f3f3f] leading-relaxed break-keep">"{ev.text}"</p>
                    {confidencePct != null && confidencePct > 0 && (
                      <p className="text-[10.5px] text-[#AEAEB2] mt-1">신뢰도 {confidencePct}%</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CommonGroundCard({ pair, aName, bName }: {
  pair: DualAnalysisResult["commonGroundPairs"][number];
  aName: string;
  bName: string;
}) {
  const style = PAIR_STYLES[pair.pairType] ?? { color: "#636366", bg: "#F5F5F7" };
  return (
    <div className="bg-white rounded-2xl border border-[#EBEBF0] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F5F5F7]">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: style.color }} />
        <span className="text-[12.5px] font-bold" style={{ color: style.color }}>{pair.pairTypeDisplayName}</span>
        <span className="ml-auto text-[10.5px] text-[#AEAEB2]">유사도 {Math.round(pair.similarity * 100)}%</span>
      </div>
      <div className="p-4 space-y-2.5">
        {pair.aStatement && (
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">{aName.charAt(0)}</div>
            <p className="text-[12.5px] text-[#3f3f3f] leading-relaxed break-keep flex-1">"{pair.aStatement.text}"</p>
          </div>
        )}
        {pair.bStatement && (
          <div className="flex gap-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">{bName.charAt(0)}</div>
            <p className="text-[12.5px] text-[#3f3f3f] leading-relaxed break-keep flex-1">"{pair.bStatement.text}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard Page ── */
export function DashboardPage() {
  const navigate = useNavigate();
  const [llmResult, setLlmResult] = useState<LlmResult | null>(null);
  const [dualResult, setDualResult] = useState<DualAnalysisResult | null>(null);
  const [evidenceResult, setEvidenceResult] = useState<LlmEvidenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [personNames, setPersonNames] = useState({ a: "A", b: "B" });
  const [relationship, setRelationship] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisData");
    if (!stored) {
      setErrorMsg("분석 데이터가 없습니다. 홈으로 돌아가 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    let parsed: { sessionId?: string; personA?: { name: string }; personB?: { name: string } };
    try {
      parsed = JSON.parse(stored);
    } catch {
      setErrorMsg("분석 데이터가 손상되었습니다.");
      setIsLoading(false);
      return;
    }

    if (parsed.personA?.name) setPersonNames({ a: parsed.personA.name, b: parsed.personB?.name ?? "B" });

    const sessionId = parsed.sessionId;
    if (!sessionId) {
      setErrorMsg("세션 정보가 없습니다. 백엔드 연동 후 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }

    // 저장된 room 데이터에서 관계 유형 읽기
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
      }).finally(() => setIsLoading(false));
    };

    // GET 먼저 시도 → 없으면 POST로 생성, ANALYSIS_NOT_READY면 재시도
    const tryLoad = (retryCount = 0) => {
      api.getLlmAnalysis(sessionId)
        .then(handleLoadedLlm)
        .catch((err: ApiError) => {
          if (err.code === "LLM_RESULT_NOT_FOUND") {
            api.generateLlmAnalysis(sessionId)
              .then(handleLoadedLlm)
              .catch((genErr: ApiError) => {
                if (genErr.code === "ANALYSIS_NOT_READY" && retryCount < 10) {
                  // 모델 분석 아직 진행 중 → 2초 후 재시도
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

  const header = (
    <header className="bg-white border-b border-[#EBEBF0] px-5 h-14 flex items-center justify-between sticky top-0 z-[500]">
      <button onClick={() => navigate("/home")} className="w-8 h-8 flex items-center justify-center text-[#636366] hover:bg-[#F5F5F7] rounded-lg transition-all">
        <Home size={18} strokeWidth={2} />
      </button>
      <p className="text-[15px] font-bold text-[#222222] tracking-tight">분석 대시보드</p>
      <div className="w-8" />
    </header>
  );

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={32} className="text-[#c9485b]" />
          </motion.div>
          <p className="text-[14px] text-[#636366] font-medium">AI가 갈등을 분석하고 있어요…</p>
          <p className="text-[12px] text-[#AEAEB2]">잠시만 기다려주세요. 최대 30초 정도 소요될 수 있어요.</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (errorMsg || !llmResult) {
    return (
      <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-14 h-14 bg-[#fff5f7] rounded-2xl flex items-center justify-center">
            <AlertCircle size={24} className="text-[#c9485b]" />
          </div>
          <p className="text-[16px] font-bold text-[#222222] text-center">분석 결과를 불러올 수 없어요</p>
          <p className="text-[13px] text-[#636366] text-center leading-relaxed">{errorMsg}</p>
          <button onClick={() => navigate("/home")}
            className="mt-2 px-6 h-11 bg-[#ffd1da] text-[#222222] rounded-xl font-semibold text-[14px] hover:bg-[#ffb3c4] active:scale-[0.98] transition-all">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { sections, diagramKeywords, resultText } = llmResult;
  const { a: aName, b: bName } = personNames;
  const date = new Date(llmResult.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
  const mindmapData = buildMindmapData({ llmResult, aName, bName, relationship, date, evidenceResult });

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
      {header}

      <div className="flex-1 overflow-y-auto pb-12 w-full max-w-[1200px] mx-auto">

        {/* Title */}
        <div className="px-5 pt-6 pb-5 bg-white border-b border-[#EBEBF0]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 bg-[#fff5f7] rounded-full text-[11.5px] font-semibold text-[#c9485b]">{date}</span>
            {relationship && <span className="px-2.5 py-0.5 bg-[#F5F5F7] rounded-full text-[11.5px] font-semibold text-[#636366]">{relationship}</span>}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13.5px] font-semibold text-[#f07090]">{aName}</span>
            <span className="text-[12px] text-[#AEAEB2]">·</span>
            <span className="text-[13.5px] font-semibold text-[#7b87ff]">{bName}</span>
          </div>
          <p className="text-[13px] text-[#AEAEB2]">두 사람의 관점을 AI가 재구성하여 갈등의 구조를 보여드립니다.</p>
        </div>

        <MindmapVisualization data={mindmapData} />

        {/* 핵심 갈등 키워드 */}
        {diagramKeywords.coreConflict.length > 0 && (
          <div className="px-4 sm:px-5 pt-5 mb-0">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 border border-[#EBEBF0] overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c9485b] to-[#ffd1da] rounded-l-2xl" />
              <div className="pl-3">
                <p className="text-[12px] font-semibold text-[#c9485b] mb-3">핵심 갈등 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {diagramKeywords.coreConflict.map((kw) => (
                    <span key={kw} className="px-3 py-1.5 bg-[#fff5f7] border border-[#ffd1da] rounded-full text-[12.5px] font-semibold text-[#c9485b]">{kw}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* AI 종합 분석 */}
        <div className="px-4 sm:px-5 py-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0"><Wand2 size={16} strokeWidth={2.5} /></div>
            <p className="text-[14.5px] font-bold text-[#222222]">AI 종합 분석</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 border border-[#EBEBF0]">
            <p className="text-[13.5px] text-[#3f3f3f] leading-[1.8] break-keep whitespace-pre-wrap">{resultText}</p>
          </motion.div>
        </div>

        {/* 요소별 상세 분석 */}
        <div className="px-4 sm:px-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 bg-[#F5F5F7] text-[#636366] rounded-xl flex items-center justify-center flex-shrink-0"><Target size={16} strokeWidth={2.5} /></div>
            <p className="text-[14.5px] font-bold text-[#222222]">요소별 상세 분석</p>
          </motion.div>
          <div className="space-y-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}>
                <CategoryCard
                  cat={cat}
                  aName={aName}
                  bName={bName}
                  aText={sections[cat.id]?.a ?? ""}
                  bText={sections[cat.id]?.b ?? ""}
                  keywords={diagramKeywords[cat.id] ?? []}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 갈등 포인트 */}
        {dualResult && dualResult.tensions.length > 0 && (
          <div className="px-4 sm:px-5 mb-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FEF2F2] text-[#E55050]">
                <Target size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[14.5px] font-bold text-[#222222]">갈등 포인트</p>
              <span className="ml-1 px-2 py-0.5 bg-[#FEF2F2] text-[#E55050] rounded-full text-[11px] font-semibold">{dualResult.tensions.length}개</span>
            </motion.div>
            <div className="space-y-3">
              {dualResult.tensions.map((tension, i) => (
                <motion.div key={tension.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 + i * 0.06 }}>
                  <TensionCard tension={tension} aName={aName} bName={bName} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 두 사람의 공통점 */}
        {dualResult && dualResult.commonGroundPairs.length > 0 && (
          <div className="px-4 sm:px-5 mb-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#E8F6F0] text-[#5BB89A]">
                <HelpCircle size={16} strokeWidth={2.5} />
              </div>
              <p className="text-[14.5px] font-bold text-[#222222]">두 사람의 공통점</p>
              <span className="ml-1 px-2 py-0.5 bg-[#E8F6F0] text-[#5BB89A] rounded-full text-[11px] font-semibold">{dualResult.commonGroundPairs.length}개</span>
            </motion.div>
            <div className="space-y-3">
              {dualResult.commonGroundPairs.map((pair, i) => (
                <motion.div key={pair.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47 + i * 0.05 }}>
                  <CommonGroundCard pair={pair} aName={aName} bName={bName} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 관계 전환 키워드 */}
        {diagramKeywords.relationshipShift.length > 0 && (
          <div className="px-4 sm:px-5 mb-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-5 border border-[#EBEBF0]">
              <p className="text-[12px] font-semibold text-[#636366] mb-3">관계 회복을 위한 전환점</p>
              <div className="flex flex-wrap gap-2">
                {diagramKeywords.relationshipShift.map((kw) => (
                  <span key={kw} className="px-3 py-1.5 bg-[#E8F6F0] text-[#5BB89A] rounded-full text-[12.5px] font-semibold">{kw}</span>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 함께 생각해볼 질문 */}
        {sections.questions.length > 0 && (
          <div className="px-4 sm:px-5 mb-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-white rounded-2xl p-5 border border-[#EBEBF0]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0"><HelpCircle size={16} strokeWidth={2.5} /></div>
                <p className="text-[14.5px] font-bold text-[#222222]">함께 생각해볼 질문</p>
              </div>
              <p className="text-[12.5px] text-[#AEAEB2] mb-4">아래 질문들이 두 분의 갈등 해결에 실마리가 될 수 있어요.</p>
              <div className="space-y-2.5">
                {sections.questions.map((q, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
                    className="flex gap-3 items-start bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]">
                    <div className="min-w-5 h-5 rounded-full bg-[#fff5f7] text-[#c9485b] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-[13px] text-[#636366] leading-relaxed">{q}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
