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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

/* ── Types ── */
interface KeywordItem {
  text: string;
  sourceText: string;
  confidence: number;
}
interface SelectedNode extends KeywordItem {
  rect: DOMRect;
}

/* ── Mock Data ── */
const SOLO_MOCK = {
  title: "친구와의 서운한 감정",
  date: "2026.04.13",

  keywords: {
    fact: [
      { text: "약속 30분 지각", sourceText: "친구가 약속 시간보다 30분 늦게 나타났어요. 미리 연락도 없었어요.", confidence: 91 },
      { text: "사과 없이 넘어감", sourceText: "왔는데 '미안'이라는 말 한마디도 없이 어디 갈지 얘기했어요.", confidence: 88 },
      { text: "세 번 연속 지각", sourceText: "이번이 세 번째인데 매번 이런 식이에요.", confidence: 85 },
    ],
    interpretation: [
      { text: "나를 중요하게 생각 안 함", sourceText: "이 정도면 저를 신경 쓰지 않는다는 느낌이 들어요.", confidence: 79 },
      { text: "배려심 부족", sourceText: "기다리게 하면 얼마나 불편한지 생각 안 하는 것 같아요.", confidence: 82 },
      { text: "당연하게 여기는 것 같음", sourceText: "제가 항상 기다려주니까 당연하다고 생각하는 것 같아요.", confidence: 76 },
    ],
    emotion: [
      { text: "서운함", sourceText: "솔직히 많이 서운했어요.", confidence: 94 },
      { text: "화남", sourceText: "기다리면서 속으로 꽤 화가 났어요.", confidence: 90 },
      { text: "민망함", sourceText: "카페에서 혼자 기다리는 게 민망하기도 했고.", confidence: 85 },
      { text: "말 못해서 답답함", sourceText: "화내기도 그렇고 그냥 참았는데 더 답답했어요.", confidence: 88 },
    ],
    request: [
      { text: "미리 연락해줬으면", sourceText: "늦을 것 같으면 미리 문자라도 보내줬으면 해요.", confidence: 87 },
      { text: "사과 한마디", sourceText: "늦었으면 미안하다는 말 한마디가 그렇게 어렵나요.", confidence: 89 },
      { text: "배려받고 싶음", sourceText: "친구니까 더 잘 챙겨줬으면 하는 마음이에요.", confidence: 83 },
    ],
  },

  aiSummary:
    "친구가 약속 시간을 반복적으로 지키지 않고 사과 없이 넘어가는 상황이 세 차례 이상 반복되면서 쌓인 감정을 정리하고 싶은 상황입니다. 단순한 지각의 문제가 아니라, 관계에서 존중받고 있는지에 대한 불확실함이 핵심입니다.",

  thoughtPoint: {
    coreDesire: "관계에서 '존중받고 싶다'는 욕구",
    description:
      "지금 가장 힘든 지점은 지각 자체보다 '나는 이 친구에게 중요한 사람일까?'라는 의문입니다. 배려와 사과를 바라는 것은 사실 그 이상의 것, 즉 내가 이 관계에서 소중히 여겨지고 있다는 확인을 원하기 때문입니다. 이 욕구가 충족되지 않을 때마다 화가 쌓이지만, 직접 말하기 어려워 참는 패턴이 반복되는 것 같습니다.",
  },

  aiAnalysis: {
    mainInsight:
      "친구의 반복적인 지각이 단순한 습관의 문제일 수 있지만, 당신에게는 '나를 어떻게 대하는가'에 대한 신호로 읽히고 있어요.",
    advice: [
      "참고 넘어가는 패턴이 반복될수록 감정은 더 쌓입니다. 다음에 비슷한 상황이 생기면, 그 자리에서 가볍게 '기다리는 거 좀 힘들었어'라고 말해보는 것을 추천해요.",
      "상대방은 지각이 당신에게 얼마나 큰 의미인지 모를 수 있어요. 비난이 아닌 '나의 경험'을 전달하면 상대방도 방어적이 되지 않고 들을 가능성이 높아집니다.",
      "이 관계가 당신에게 중요하다면, 솔직한 대화 한 번이 쌓인 감정을 해소하는 데 훨씬 효과적일 수 있어요.",
    ],
  },

  clarifyingQuestions: [
    "이 친구에게 직접 서운함을 표현해본 적이 있나요? 그때 어떤 반응이었나요?",
    "이 상황에서 당신이 진짜 원하는 것은 사과인가요, 아니면 앞으로 달라지는 모습인가요?",
    "이 감정을 참고 넘어갔을 때, 나중에 어떤 감정이 남았나요?",
  ],
};

const CATEGORIES = [
  { id: "fact" as const, label: "사실", en: "Fact", icon: ListChecks, color: "#818CF8", bg: "#EEF2FF" },
  { id: "interpretation" as const, label: "해석", en: "Interpret", icon: BrainCircuit, color: "#F0A858", bg: "#FEF6E8" },
  { id: "emotion" as const, label: "감정", en: "Feel", icon: HeartPulse, color: "#E88FA0", bg: "#FDF2F4" },
  { id: "request" as const, label: "요구", en: "Need", icon: Send, color: "#5BB89A", bg: "#E8F6F0" },
];

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
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#ffd1da]/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
            <span className="text-[10.5px] font-semibold text-[#ffd1da]">신뢰도 {node.confidence}%</span>
          </div>
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

/* ── Branch Visualization with Tabs ── */
function BranchVisualization({ data }: { data: typeof SOLO_MOCK }) {
  const [activeTab, setActiveTab] = useState("fact");
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  const handleSelect = (item: KeywordItem, rect: DOMRect) => {
    if (selectedNode?.text === item.text) setSelectedNode(null);
    else setSelectedNode({ ...item, rect });
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

  useEffect(() => { setSelectedNode(null); }, [activeTab]);

  return (
    <div className="px-4 sm:px-5 py-5">
      <AnimatePresence>
        {selectedNode && (
          <FixedTooltip node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto bg-transparent border-b border-[#EBEBF0] rounded-none p-0 mb-5 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="px-4 py-3 rounded-none border-b-2 font-semibold text-[13.5px] transition-colors whitespace-nowrap -mb-[1px] data-[state=active]:text-[#1C1C1E] data-[state=inactive]:border-transparent data-[state=inactive]:text-[#AEAEB2]"
              style={{ borderColor: activeTab === cat.id ? cat.color : "transparent" }}
            >
              {cat.label} {cat.en}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl border border-[#EBEBF0]"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <span className="text-[11.5px] text-[#AEAEB2] font-medium">키워드를 탭하면 원문이 보여요</span>
              </div>
              <BranchDiagram
                items={data.keywords[cat.id]}
                cat={cat}
                onSelect={handleSelect}
                selectedNode={selectedNode}
              />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/* ── Main Solo Dashboard ── */
export function SoloDashboard() {
  const navigate = useNavigate();
  const [data] = useState(SOLO_MOCK);
  const [expandedAdvice, setExpandedAdvice] = useState(false);

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

      <div className="flex-1 overflow-y-auto pb-12 w-full max-w-[1200px] mx-auto">
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

        {/* Branching Visualization */}
        <BranchVisualization data={data} />

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
      </div>
    </div>
  );
}
