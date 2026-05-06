import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Home,
  ListChecks,
  BrainCircuit,
  HeartPulse,
  Send,
  AlertTriangle,
  HelpCircle,
  Target,
  X,
  Quote,
  Wand2,
  ArrowRightLeft,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

interface KeywordItem { text: string; sourceText: string; confidence: number; }
interface SelectedNode extends KeywordItem { rect: DOMRect; }

const MOCK_DATA = {
  title: "연락 빈도 문제",
  date: "2026.03.28",
  relationship: "연인",
  me: { name: "민수" },
  partner: { name: "지은" },
  mindmap: {
    fact: {
      shared: [
        { text: "밤 10시 이후 연락 두절", sourceText: "어제 밤 10시 넘어서 계속 전화를 안 받더라고요.", confidence: 92 },
        { text: "약속 시간 변경 문제", sourceText: "주말 데이트 시간도 당일 아침에 갑자기 바꾸자고 했잖아요.", confidence: 88 },
      ],
      meOnly: [
        { text: "3시간 동안 확인함", sourceText: "진짜 3시간 내내 카톡 확인하고 전화했는데 다 안 받았습니다.", confidence: 95 },
        { text: "읽씹 상태", sourceText: "심지어 카톡 하나는 읽었으면서 답장도 안 했어요.", confidence: 91 },
        { text: "전날에도 연락 지연", sourceText: "그제도 톡 답장이 2시간씩 걸렸어요.", confidence: 84 },
      ],
      partnerOnly: [
        { text: "극도로 피곤한 상태", sourceText: "어제 야근하고 너무 피곤해서 씻자마자 기절했어요.", confidence: 93 },
        { text: "알림을 못 봄", sourceText: "무음으로 해놔서 전화 온 줄도 몰랐어요.", confidence: 90 },
        { text: "주말 출근 스트레스", sourceText: "주말에도 출근해야 해서 예민한 상태였어요.", confidence: 82 },
      ],
    },
    interpretation: { shared: [] as KeywordItem[], meOnly: [] as KeywordItem[], partnerOnly: [] as KeywordItem[] },
    emotion: {
      shared: [{ text: "서로에 대한 미안함", sourceText: "어쨌든 이렇게 싸우게 된 건 서로 미안하죠.", confidence: 87 }],
      meOnly: [
        { text: "서운함", sourceText: "연락 한 통 없는 게 너무 서운했어요.", confidence: 96 },
        { text: "불안", sourceText: "무슨 일 있는 건 아닌지 계속 불안했습니다.", confidence: 90 },
        { text: "무시당하는 느낌", sourceText: "저를 완전히 무시하는 것 같아서 기분이 나빴어요.", confidence: 83 },
      ],
      partnerOnly: [
        { text: "당황", sourceText: "아침에 일어나서 부재중 전화 보고 엄청 당황했어요.", confidence: 89 },
        { text: "억울함", sourceText: "일부러 안 받은 것도 아닌데 화내니까 억울하더라고요.", confidence: 86 },
      ],
    },
    request: {
      shared: [{ text: "배려하는 연락 습관", sourceText: "앞으로는 연락 문제로 스트레스 받지 않게 잘 조율했으면 좋겠어요.", confidence: 91 }],
      meOnly: [{ text: "자기 전 인사 메시지", sourceText: "아무리 피곤해도 자기 전에는 꼭 연락 한 통 남겨줬으면 좋겠습니다.", confidence: 94 }],
      partnerOnly: [{ text: "피곤할 때 여유", sourceText: "제가 너무 피곤해서 쓰러져 잘 때는 조금 이해해줬으면 해요.", confidence: 88 }],
    },
  },
  interpretationBranches: [
    {
      id: "fact-1",
      fact: { text: "밤 10시 이후 연락 두절", sourceText: "어제 10시부터 갑자기 연락이 끊겼어요.", confidence: 92 },
      me: [
        { text: "나를 무시하는 것", sourceText: "바빠도 톡 하나 남길 수 있는데, 저를 중요하게 생각하지 않는 것 같았어요.", confidence: 85 },
        { text: "우선순위에서 밀렸다", sourceText: "항상 저보다 일이나 다른 게 먼저인 것 같아요.", confidence: 79 },
      ],
      partner: [
        { text: "이해해줄 거라 믿었다", sourceText: "오래 사귀었으니까 피곤해서 잤다고 하면 당연히 이해해줄 줄 알았어요.", confidence: 88 },
        { text: "별일 아니라고 생각", sourceText: "그냥 하루 피곤해서 잔 건데 이렇게 크게 화낼 줄 몰랐습니다.", confidence: 83 },
      ],
    },
    {
      id: "fact-2",
      fact: { text: "약속 시간 변경 문제", sourceText: "주말 데이트 시간도 당일 아침에 갑자기 바꾸자고 했잖아요.", confidence: 88 },
      me: [{ text: "내 시간은 안 중요한가?", sourceText: "미리 말해주면 좋은데 항상 자기 편할 때만 맞춰요.", confidence: 82 }],
      partner: [{ text: "피곤해서 배려해줄 줄", sourceText: "너무 힘들어서 조금 미루자고 한 건데 이렇게 화낼 줄은...", confidence: 76 }],
    },
  ],
  conflictPeak: {
    type: "사실에 대한 다른 해석",
    category: "해석",
    description: "같은 상황을 완전히 다른 의미로 받아들이고 있어요. 민수님은 '연락 없음 = 무관심'으로, 지은님은 '피곤함 = 당연히 이해해줄 것'으로 해석하면서 간극이 가장 컸습니다.",
  },
  aiRestatements: {
    fact: { me: "민수님은 밤 10시 이후 약 3시간 동안 지은님으로부터 아무런 연락을 받지 못한 상황이었습니다.", partner: "지은님은 업무 후 극도의 피로감으로 인해 별도의 안내 없이 잠이 들었습니다." },
    interpretation: { me: "민수님에게 연락 두절은 '나에 대한 관심이 부족하다'는 신호로 읽혔습니다.", partner: "지은님은 서로의 상황을 이해해줄 수 있는 관계라고 믿었기에, 별도로 알리지 않아도 괜찮다고 판단했습니다." },
    emotion: { me: "민수님은 서운함과 함께 '혹시 무시당하는 건 아닌가'라는 두려움을 느꼈습니다.", partner: "지은님은 뒤늦게 상황을 알고 미안함과 동시에 당혹감을 느꼈습니다." },
    request: { me: "민수님은 자기 전 짧은 인사 메시지라도 있다면 안심할 수 있다고 이야기하고 있습니다.", partner: "지은님은 컨디션이 좋지 않을 때 편하게 쉴 수 있는 여유를 원하고 있습니다." },
  },
  aiSummaryAndRestatement: {
    neutralSummary: "두 사람은 '밤 10시 이후 연락 두절'이라는 같은 사실을 두고, 서로 다른 기대치로 인해 갈등을 겪고 있습니다.",
    aFromBPerspective: "지은님, 민수님은 단순히 연락을 자주 하기를 바라는 게 아니라, 피곤해서 일찍 자게 되더라도 '나 잔다'는 짧은 말 마디로 자신을 안심시켜 주기를 바랐던 것 같아요.",
    bFromAPerspective: "민수님, 지은님은 민수님을 무시하거나 우선순위에서 미룬 것이 아닙니다. 야근 후 너무 지친 나머지 오래 만난 사이니 이해해 주겠지라는 믿음 때문에 편하게 잠에 든 것 같습니다.",
    confidence: 88,
  },
  clarifyingQuestions: [
    "서로에게 '연락'이 가지는 의미가 다를 수 있어요. 각자에게 연락은 어떤 의미인지 이야기해본 적 있나요?",
    "피곤하거나 바쁠 때 연락이 어려운 상황을 미리 알려주는 방법에 대해 함께 정해본 적이 있나요?",
    "상대방이 응답이 없을 때, 가장 먼저 드는 생각은 무엇인가요?",
  ],
};

const CATEGORIES = [
  { id: "fact" as const, label: "사실", en: "Fact", icon: ListChecks, color: "#818CF8", bg: "#EEF2FF" },
  { id: "interpretation" as const, label: "해석", en: "Interpret", icon: BrainCircuit, color: "#F0A858", bg: "#FEF6E8" },
  { id: "emotion" as const, label: "감정", en: "Feel", icon: HeartPulse, color: "#E88FA0", bg: "#FDF2F4" },
  { id: "request" as const, label: "요구", en: "Need", icon: Send, color: "#5BB89A", bg: "#E8F6F0" },
];

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
            <p className="font-semibold text-[11.5px] text-white/70">입력된 원문</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#ffd1da]/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
            <span className="text-[10.5px] font-semibold text-[#ffd1da]">신뢰도 {node.confidence}%</span>
          </div>
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
  data: typeof MOCK_DATA;
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
            style={{ maxWidth: 720, aspectRatio: "8 / 5" }}
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
                    className="w-fit max-w-full px-2.5 py-1.5 bg-white border border-pink-200 rounded-xl text-[11.5px] font-medium text-[#222] text-center break-keep leading-snug hover:border-pink-400 hover:bg-pink-50/40 transition-colors" />
                ))}
              </div>

              {/* Center — shared */}
              <div className="flex-[2] flex flex-col items-center justify-center gap-2"
                   style={{ paddingInline: "3px" }}>
                {catData.shared.length === 0 ? (
                  <span className="text-[9px] text-[#D1D1D6] text-center leading-snug">공통<br/>없음</span>
                ) : catData.shared.map((item, i) => (
                  <KwBtn key={`sh-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                    className="w-fit max-w-full px-2 py-1.5 rounded-xl text-[10px] font-bold text-white text-center break-keep leading-snug hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: cat.color }} />
                ))}
              </div>

              {/* Right — partner only */}
              <div className="flex-[3] flex flex-col items-center justify-center gap-2"
                   style={{ paddingInline: "5px 8px" }}>
                {catData.partnerOnly.map((item, i) => (
                  <KwBtn key={`pt-${i}`} item={item} onSelect={pick} isSelected={sel?.text === item.text}
                    className="w-fit max-w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-xl text-[11.5px] font-medium text-[#222] text-center break-keep leading-snug hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors" />
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
function MindmapVisualization({ data }: { data: typeof MOCK_DATA }) {
  const [activeTab, setActiveTab] = useState("fact");
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
          if (cat.id === "interpretation") {
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
          const catData = data.mindmap[cat.id as keyof typeof data.mindmap];
          return (
            <VennCard key={cat.id} catData={catData} cat={cat} data={data} pick={pick} sel={sel} />
          );
        })}
      </Tabs>
    </div>
  );
}

/* ── Dashboard Page ── */
export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(MOCK_DATA);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("analysisData");
      if (s) {
        const p = JSON.parse(s);
        if (p.personA && p.personB) setData((prev) => ({ ...prev, me: { name: p.personA.name || "A" }, partner: { name: p.personB.name || "B" } }));
      }
    } catch (e) { console.error(e); }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
      <header className="bg-white border-b border-[#EBEBF0] px-5 h-14 flex items-center justify-between sticky top-0 z-[500]">
        <button onClick={() => navigate("/home")} className="w-8 h-8 flex items-center justify-center text-[#636366] hover:bg-[#F5F5F7] rounded-lg transition-all">
          <Home size={18} strokeWidth={2} />
        </button>
        <p className="text-[15px] font-bold text-[#222222] tracking-tight">분석 대시보드</p>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto pb-12">
        {/* Title */}
        <div className="px-5 pt-6 pb-5 bg-white border-b border-[#EBEBF0]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 bg-[#fff5f7] rounded-full text-[11.5px] font-semibold text-[#c9485b]">{data.date}</span>
            <span className="px-2.5 py-0.5 bg-[#F5F5F7] rounded-full text-[11.5px] font-semibold text-[#636366]">{data.relationship}</span>
          </div>
          <p className="text-[20px] font-bold text-[#222222] tracking-tight mb-1.5">{data.title}</p>
          <p className="text-[13px] text-[#AEAEB2]">두 사람의 관점을 AI가 재구성하여 갈등의 구조를 보여드립니다.</p>
        </div>

        <MindmapVisualization data={data} />

        {/* Conflict Peak */}
        <div className="px-4 sm:px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-5 border border-[#EBEBF0] overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-300 rounded-l-2xl" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-orange-50 text-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} strokeWidth={2.5} />
                </div>
                <p className="text-[12px] font-semibold text-orange-500">갈등이 가장 컸던 지점</p>
                <span className="ml-auto px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full text-[11px] font-semibold border border-orange-100">{data.conflictPeak.category}</span>
              </div>
              <p className="text-[17px] font-bold text-[#222222] mb-2 tracking-tight flex items-center gap-1.5">
                <Zap size={16} className="text-orange-400" />{data.conflictPeak.type}
              </p>
              <p className="text-[13.5px] text-[#636366] leading-relaxed">{data.conflictPeak.description}</p>
            </div>
          </motion.div>
        </div>

        {/* AI Summary */}
        <div className="px-4 sm:px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0"><Wand2 size={16} strokeWidth={2.5} /></div>
            <p className="text-[14.5px] font-bold text-[#222222]">AI 요약 및 관점 전환</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-5 border border-[#EBEBF0] space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-[#ffd1da] rounded-full" />
                <p className="text-[13.5px] font-bold text-[#222222]">양측 입장 요약</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]">
                <p className="text-[13px] text-[#636366] leading-relaxed break-keep">{data.aiSummaryAndRestatement.neutralSummary}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-[#F0A858] rounded-full" />
                <p className="text-[13.5px] font-bold text-[#222222]">상대방의 언어로 듣기</p>
              </div>
              {[
                { label: `${data.partner.name}에게 전하는 ${data.me.name}의 진짜 마음`, text: data.aiSummaryAndRestatement.aFromBPerspective, color: "bg-pink-100 text-pink-600" },
                { label: `${data.me.name}에게 전하는 ${data.partner.name}의 진짜 마음`, text: data.aiSummaryAndRestatement.bFromAPerspective, color: "bg-indigo-100 text-indigo-600" },
              ].map((item, i) => (
                <div key={i} className="bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-white border border-[#EBEBF0] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ArrowRightLeft size={12} className="text-[#AEAEB2]" />
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 ${item.color} rounded-md text-[10.5px] font-semibold mb-1.5`}>{item.label}</span>
                      <p className="text-[13px] text-[#636366] leading-relaxed break-keep">"{item.text}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Detailed Analysis */}
        <div className="px-4 sm:px-5 space-y-3 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 bg-[#F5F5F7] text-[#636366] rounded-xl flex items-center justify-center flex-shrink-0"><Target size={16} strokeWidth={2.5} /></div>
            <p className="text-[14.5px] font-bold text-[#222222]">요소별 상세 분석</p>
          </motion.div>
          {CATEGORIES.map((cat, ci) => {
            const Icon = cat.icon;
            const r = data.aiRestatements[cat.id];
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + ci * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-[#EBEBF0]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg, color: cat.color }}>
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                  <p className="text-[14px] font-bold text-[#222222]">{cat.label}</p>
                </div>
                <div className="space-y-3">
                  {[{ avatar: data.me.name.charAt(0), text: r.me, cls: "bg-pink-100 text-pink-500" }, { avatar: data.partner.name.charAt(0), text: r.partner, cls: "bg-indigo-100 text-indigo-500" }].map((row, ri) => (
                    <div key={ri} className="flex gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${row.cls}`}>{row.avatar}</div>
                      <div className="flex-1 bg-[#F5F5F7] rounded-xl rounded-tl-sm p-3.5" style={{ borderLeft: `3px solid ${cat.color}40` }}>
                        <p className="text-[12.5px] text-[#636366] leading-relaxed">{row.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Questions */}
        <div className="px-4 sm:px-5 mt-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl p-5 border border-[#EBEBF0]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#fff5f7] text-[#c9485b] rounded-xl flex items-center justify-center flex-shrink-0"><HelpCircle size={16} strokeWidth={2.5} /></div>
              <p className="text-[14.5px] font-bold text-[#222222]">함께 생각해볼 질문</p>
            </div>
            <p className="text-[12.5px] text-[#AEAEB2] mb-4">아래 질문들이 두 분의 갈등 해결에 실마리가 될 수 있어요.</p>
            <div className="space-y-2.5">
              {data.clarifyingQuestions.map((q, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.08 }}
                  className="flex gap-3 items-start bg-[#F5F5F7] rounded-xl p-4 border border-[#EBEBF0]">
                  <div className="min-w-5 h-5 rounded-full bg-[#fff5f7] text-[#c9485b] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-[13px] text-[#636366] leading-relaxed">{q}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
