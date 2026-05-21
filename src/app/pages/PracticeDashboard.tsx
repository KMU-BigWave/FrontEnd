import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import {
  ConflictAnalysis,
  analyzeTwoPersonConflict,
  getCategoryColor,
  getCategoryLabel,
} from '../utils/analysisEngine';

/* ─── Mock Data (fallback) ─── */
const conflictPivots = [
  { badge: '해석', text: '의도 해석: 무시 vs 상황', color: '#F59E0B' },
  { badge: '긴급도', text: '긴급도 판단: 급함 vs 급하지 않음', color: '#6366F1' },
  { badge: '요구', text: '요구 충돌: 즉답 vs 일정 합의', color: '#10B981' },
];

const helpfulQuestions = [
  '"답장이 늦었을 때, 상대가 어떤 상황이었을 거라 생각했나요?"',
  '"급하다는 기준이 서로 달랐다면, 어떤 합의가 가능할까요?"',
];

type TabKey = 'FACT' | 'INTERPRET' | 'FEEL' | 'NEED';

const tabData: Record<TabKey, { personA: string[]; personB: string[]; common: string[] }> = {
  FACT: {
    personA: ['답장 3시간 지연', '회의 중이었음'],
    personB: ['답장 3시간 지연', '급한 요청이었음'],
    common: ['답장을 기대함', '바빴던 하루'],
  },
  INTERPRET: {
    personA: ['무시당한 느낌', '나를 중요하게 생각 안 함'],
    personB: ['상황이 어쩔 수 없었음', '과도한 기대'],
    common: ['소통 방식의 차이'],
  },
  FEEL: {
    personA: ['서운함', '불안'],
    personB: ['답답함', '억울함'],
    common: ['피로감'],
  },
  NEED: {
    personA: ['즉각 응답', '관심 표현'],
    personB: ['이해와 여유', '일정 합의'],
    common: ['존중', '명확한 소통'],
  },
};

const pivotChips = [
  { label: 'Interpretation Gap', color: '#F59E0B' },
  { label: 'Emotional Clash', color: '#FF6B8A' },
  { label: 'Demand Conflict', color: '#10B981' },
];

const butterflyLayers = [
  { key: 'fact', label: '사실', sub: 'Fact', color: '#6366F1', bg: '#EEF2FF', personA: ['답장 3시간 지연', '회의 중'], personB: ['답장 3시간 지연', '급한 요청'], common: ['답장을 기대함'] },
  { key: 'interpretation', label: '해석', sub: 'Interpret', color: '#F59E0B', bg: '#FEF3C7', personA: ['무시당한 느낌'], personB: ['어쩔 수 없었음'], common: ['소통 방식의 차이'] },
  { key: 'emotion', label: '감정', sub: 'Emotion', color: '#FF6B8A', bg: '#FFF0F3', personA: ['서운함', '불안'], personB: ['답답함', '억울함'], common: ['피로감'] },
  { key: 'need', label: '요구', sub: 'Need', color: '#10B981', bg: '#D1FAE5', personA: ['즉각 응답', '관심'], personB: ['이해', '여유'], common: ['존중'] },
];

/* ─── Sparkle decorations ─── */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" fill="currentColor" />
    </svg>
  );
}

/* ─── Main Component ─── */
export function PracticeDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<'dashboard' | 'visualization'>('dashboard');
  const [analysis, setAnalysis] = useState<ConflictAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const rawData = sessionStorage.getItem('analysisData');
      if (rawData) {
        const data = JSON.parse(rawData);
        const result = analyzeTwoPersonConflict(data.personA, data.personB);
        setAnalysis(result);
      }
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative mb-8">
            <motion.div
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#FF8FA8]"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-1 -right-1 text-[#FFD166]"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              <Sparkle />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-2 text-[#A78BFA]"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
            >
              <Sparkle />
            </motion.div>
          </div>
          <h3 className="mb-2 text-gray-800">분석하고 있어요</h3>
          <p className="text-sm text-gray-400">갈등의 구조를 살펴보는 중이에요</p>
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#FF6B8A]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-pink-100/60">
        <div className="mx-auto max-w-[960px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={() => navigate('/home')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-[18px] h-[18px] text-gray-500" />
            </button>
            <div className="flex items-center gap-1 bg-[#FFF0F3]/60 rounded-full p-1">
              {(['dashboard', 'visualization'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all ${
                    view === v
                      ? 'bg-white text-[#E85577] shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {v === 'dashboard' ? '대시보드' : '시각화'}
                </button>
              ))}
            </div>
          </div>
          <Link to="/new">
            <button className="h-10 px-5 bg-gradient-to-r from-[#FF6B8A] to-[#FF8FA8] text-white text-sm rounded-full hover:shadow-md hover:shadow-pink-200/50 transition-all">
              새 갈등 분석하기
            </button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <DashboardView analysis={analysis} />
          </motion.div>
        ) : (
          <motion.div
            key="visualization"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <VisualizationView onBack={() => setView('dashboard')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════ Butterfly Diagram ═══════════════════ */
function ButterflyDiagram() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const W = 920;
  const centerX = W / 2;
  const layerStartY = 70;
  const layerGap = 120;
  const branchLen = 160;
  const chipW = 120;
  const chipH = 30;
  const chipR = 15;
  const commonChipW = 130;

  return (
    <svg viewBox={`0 0 ${W} ${layerStartY + butterflyLayers.length * layerGap + 20}`} className="w-full">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B8A" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <text x={centerX - branchLen - 40} y={28} textAnchor="middle" fontSize="13" fontWeight="500" fill="#FF6B8A">Person A</text>
      <text x={centerX + branchLen + 40} y={28} textAnchor="middle" fontSize="13" fontWeight="500" fill="#6366F1">Person B</text>

      <line x1={centerX} y1={layerStartY - 10} x2={centerX} y2={layerStartY + (butterflyLayers.length - 1) * layerGap + 10} stroke="url(#spineGrad)" strokeWidth="2" strokeDasharray="6 4" />

      {butterflyLayers.map((layer, layerIdx) => {
        const rowY = layerStartY + layerIdx * layerGap;
        return (
          <g key={layer.key}>
            <rect x={0} y={rowY - 18} width={56} height={36} rx={12} fill={layer.bg} />
            <text x={28} y={rowY - 2} textAnchor="middle" fontSize="9" fill={layer.color}>{layer.sub}</text>
            <text x={28} y={rowY + 12} textAnchor="middle" fontSize="12" fontWeight="500" fill={layer.color}>{layer.label}</text>

            {layer.personA.map((chip, chipIdx) => {
              const totalChips = layer.personA.length;
              const endX = centerX - branchLen - 30;
              const endY = rowY + (chipIdx - (totalChips - 1) / 2) * 36;
              const ctrlX1 = centerX - 60;
              const ctrlX2 = centerX - branchLen + 40;
              const isHovered = hoveredNode === `a-${layer.key}-${chipIdx}`;
              const nodeId = `a-${layer.key}-${chipIdx}`;
              return (
                <g key={nodeId} onMouseEnter={() => setHoveredNode(nodeId)} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
                  <path d={`M ${centerX} ${rowY} C ${ctrlX1} ${rowY}, ${ctrlX2} ${endY}, ${endX + chipW / 2} ${endY}`} fill="none" stroke="#FF6B8A" strokeWidth={isHovered ? 2 : 1} strokeOpacity={isHovered ? 0.5 : 0.12} />
                  <rect x={endX - chipW / 2} y={endY - chipH / 2} width={chipW} height={chipH} rx={chipR} fill={isHovered ? '#FF6B8A' : 'white'} stroke="#FF6B8A" strokeWidth={isHovered ? 1.5 : 0.8} strokeOpacity={isHovered ? 1 : 0.25} filter={isHovered ? 'url(#glow)' : undefined} />
                  <text x={endX} y={endY + 4} textAnchor="middle" fontSize="11" fill={isHovered ? 'white' : '#374151'}>{chip}</text>
                </g>
              );
            })}

            {layer.personB.map((chip, chipIdx) => {
              const totalChips = layer.personB.length;
              const endX = centerX + branchLen + 30;
              const endY = rowY + (chipIdx - (totalChips - 1) / 2) * 36;
              const ctrlX1 = centerX + 60;
              const ctrlX2 = centerX + branchLen - 40;
              const isHovered = hoveredNode === `b-${layer.key}-${chipIdx}`;
              const nodeId = `b-${layer.key}-${chipIdx}`;
              return (
                <g key={nodeId} onMouseEnter={() => setHoveredNode(nodeId)} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
                  <path d={`M ${centerX} ${rowY} C ${ctrlX1} ${rowY}, ${ctrlX2} ${endY}, ${endX - chipW / 2} ${endY}`} fill="none" stroke="#6366F1" strokeWidth={isHovered ? 2 : 1} strokeOpacity={isHovered ? 0.5 : 0.12} />
                  <rect x={endX - chipW / 2} y={endY - chipH / 2} width={chipW} height={chipH} rx={chipR} fill={isHovered ? '#6366F1' : 'white'} stroke="#6366F1" strokeWidth={isHovered ? 1.5 : 0.8} strokeOpacity={isHovered ? 1 : 0.25} filter={isHovered ? 'url(#glow)' : undefined} />
                  <text x={endX} y={endY + 4} textAnchor="middle" fontSize="11" fill={isHovered ? 'white' : '#374151'}>{chip}</text>
                </g>
              );
            })}

            {layer.common.map((chip, ci) => {
              const commonY = rowY + (ci - (layer.common.length - 1) / 2) * 34;
              const isHovered = hoveredNode === `c-${layer.key}-${ci}`;
              const nodeId = `c-${layer.key}-${ci}`;
              return (
                <g key={nodeId} onMouseEnter={() => setHoveredNode(nodeId)} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
                  <rect x={centerX - commonChipW / 2 - 3} y={commonY - chipH / 2 - 3} width={commonChipW + 6} height={chipH + 6} rx={chipR + 3} fill={layer.color} fillOpacity={isHovered ? 0.12 : 0.06} />
                  <rect x={centerX - commonChipW / 2} y={commonY - chipH / 2} width={commonChipW} height={chipH} rx={chipR} fill={isHovered ? layer.color : layer.bg} stroke={layer.color} strokeWidth={isHovered ? 1.5 : 1} strokeOpacity={isHovered ? 1 : 0.4} />
                  <text x={centerX} y={commonY + 4} textAnchor="middle" fontSize="11" fontWeight="500" fill={isHovered ? 'white' : layer.color}>{chip}</text>
                </g>
              );
            })}
          </g>
        );
      })}

      <g transform={`translate(${centerX}, ${layerStartY + butterflyLayers.length * layerGap + 6})`}>
        <circle cx={-100} cy={0} r={4} fill="#FF6B8A" fillOpacity="0.4" />
        <text x={-92} y={4} fontSize="10" fill="#9ca3af">A의 고유 인식</text>
        <rect x={-12} y={-5} width={10} height={10} rx={5} fill="#8B5CF6" fillOpacity="0.2" stroke="#8B5CF6" strokeOpacity="0.4" strokeWidth="0.5" />
        <text x={4} y={4} fontSize="10" fill="#9ca3af">공통 인식</text>
        <circle cx={80} cy={0} r={4} fill="#6366F1" fillOpacity="0.4" />
        <text x={88} y={4} fontSize="10" fill="#9ca3af">B의 고유 인식</text>
      </g>
    </svg>
  );
}

/* ═══════════════════ Dashboard View ═══════════════════ */
function DashboardView({ analysis }: { analysis: ConflictAnalysis | null }) {
  const isTwoPerson = analysis?.mode === 'two-person';

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div className="relative">
          <motion.div
            className="absolute -top-3 -left-4 text-[#FFD166]/60"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkle />
          </motion.div>
          <h2 className="mb-2 text-gray-800">갈등 구조 요약</h2>
          <p className="text-sm text-gray-400">
            두 사람의 입장을 구조화해 공통점과 분기점을 한눈에 보여줘요
          </p>
        </div>
      </div>

      {/* Hero: Butterfly Diagram */}
      <motion.div
        className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40 p-6 md:p-8 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <span className="text-[10px]">🔍</span>
            </div>
            <h4 className="text-gray-800">갈등 구조 한눈에 보기</h4>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-6 ml-8">
          중앙은 두 사람의 공통 인식, 좌우는 각자의 고유한 시각이에요
        </p>
        <ButterflyDiagram />
      </motion.div>

      {/* 2-Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
        {/* Conflict Pivots */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">⚡</span>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Conflict Pivots</p>
              <h4 className="text-gray-800">가장 큰 분기점 TOP 3</h4>
            </div>
          </div>
          <div className="space-y-3">
            {conflictPivots.map((p, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAFAFA] hover:bg-[#FFF8FA] transition-colors"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <span className="flex-shrink-0 mt-0.5 px-2.5 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: p.color }}>
                  {p.badge}
                </span>
                <span className="text-sm text-gray-600">{p.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Helpful Questions */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 100 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">💬</span>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Helpful Questions</p>
              <h4 className="text-gray-800">확인 질문</h4>
            </div>
          </div>
          <div className="space-y-3 mb-5">
            {helpfulQuestions.map((q, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF8FA] to-[#F8F0FF] border border-pink-100/30">
                <p className="text-sm text-gray-600 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
          <button className="text-xs text-[#FF6B8A] hover:text-[#E85577] transition-colors">
            + 더 생성하기
          </button>
        </motion.div>
      </div>

      {/* ─── Text Analysis Results ─── */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <span className="text-base">📝</span>
            <div>
              <h3 className="text-gray-800">상세 분석 결과</h3>
              <p className="text-sm text-gray-400 mt-1">AI가 구조 분해한 텍스트 분석이에요</p>
            </div>
          </div>

          {isTwoPerson && analysis.personA && analysis.personB ? (
            <TwoPersonTextResults analysis={analysis} />
          ) : null}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Two Person Text Results ─── */
function TwoPersonTextResults({ analysis }: { analysis: ConflictAnalysis }) {
  const { personA, personB, sharedFacts, similarNeeds } = analysis;
  if (!personA || !personB) return null;

  const categories: ('interpretation' | 'emotion' | 'need')[] = ['interpretation', 'emotion', 'need'];

  return (
    <div className="space-y-8">
      {/* Shared Facts */}
      {sharedFacts.length > 0 && (
        <motion.div
          className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: '#EEF2FF', color: '#6366F1' }}>
              사실
            </div>
            <span className="text-sm text-gray-400">두 사람의 공통 사실</span>
          </div>
          <div className="space-y-5">
            {sharedFacts.map((fact) => (
              <div key={fact.id} className="border-l-2 border-[#6366F1] pl-5 py-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {fact.keywords.map((kw) => (
                    <span key={kw} className="text-sm text-[#6366F1]">{kw}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{fact.detailText}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category based */}
      {categories.map((cat) => {
        const itemsA = personA.items.filter((i) => i.category === cat);
        const itemsB = personB.items.filter((i) => i.category === cat);
        if (itemsA.length === 0 && itemsB.length === 0) return null;

        const color = getCategoryColor(cat);
        const label = getCategoryLabel(cat);

        return (
          <motion.div
            key={cat}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: `${color}15`, color }}>{label}</div>
            </div>

            <div className="space-y-8">
              {itemsA.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#FF8FA8] flex items-center justify-center text-white text-xs">
                      {personA.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-500">{personA.name}의 {label}</span>
                  </div>
                  <div className="space-y-4">
                    {itemsA.map((item) => (
                      <div key={item.id} className="border-l-2 pl-5 py-1" style={{ borderColor: '#FF6B8A' }}>
                        <span className="text-sm text-gray-800">{item.keywords.join(' · ')}</span>
                        <p className="text-sm text-gray-500 leading-relaxed mt-1">{item.detailText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {itemsB.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white text-xs">
                      {personB.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-500">{personB.name}의 {label}</span>
                  </div>
                  <div className="space-y-4">
                    {itemsB.map((item) => (
                      <div key={item.id} className="border-l-2 pl-5 py-1" style={{ borderColor: '#6366F1' }}>
                        <span className="text-sm text-gray-800">{item.keywords.join(' · ')}</span>
                        <p className="text-sm text-gray-500 leading-relaxed mt-1">{item.detailText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Insights */}
      <motion.div
        className="rounded-3xl bg-gradient-to-br from-[#FFF0F3] via-[#FFF8FA] to-[#F3E8FF] p-6 md:p-8 border border-pink-100/40"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="text-base">✨</span>
          <span className="text-sm text-[#E85577]">핵심 인사이트</span>
        </div>
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-[#FF6B8A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B8A]" />
            </div>
            <div>
              <p className="text-sm text-gray-800 mb-1">해석의 차이가 갈등의 핵심</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                같은 사실에 대해 {personA.name}님은 '존중의 부재'로, {personB.name}님은 '불가항력적 상황'으로 해석하고 있어요.
                두 해석 모두 각자의 관점에서는 타당하며, 갈등 해소의 첫 걸음은 상대의 해석을 이해하려는 시도예요.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-[#A78BFA]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
            </div>
            <div>
              <p className="text-sm text-gray-800 mb-1">숨겨진 공통점이 있어요</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                표면적으로는 다른 감정이지만, 두 사람 모두 근본적으로는{' '}
                {similarNeeds.map((n, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    <span className="text-[#FF6B8A]">{n}</span>
                  </span>
                ))}을 원하고 있어요. 이 공통 니즈가 대화의 출발점이 될 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════ Visualization View ═══════════════════ */
function VisualizationView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('FACT');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activePivot, setActivePivot] = useState<number | null>(null);

  const tabs: { key: TabKey; label: string; color: string }[] = [
    { key: 'FACT', label: '사실 Fact', color: '#6366F1' },
    { key: 'INTERPRET', label: '해석 Interpret', color: '#F59E0B' },
    { key: 'FEEL', label: '감정 Emotion', color: '#FF6B8A' },
    { key: 'NEED', label: '요구 Need', color: '#10B981' },
  ];

  const currentTab = tabs.find((t) => t.key === activeTab)!;
  const data = tabData[activeTab];

  const evidenceMap: Record<string, string[]> = {
    '답장 3시간 지연': ['"오후 2시에 메시지를 보냈는데 5시가 넘어서야 답장이 왔어요."', '"바로 확인했지만 회의 중이라 답장을 못 했습니다."'],
    '무시당한 느낌': ['"읽씹당한 것 같아서 화가 났어요."', '"내가 보낸 메시지가 중요하지 않다는 뜻으로 느껴졌어요."'],
    '서운함': ['"항상 내가 먼저 연락하는 것 같아서 서운했어요."'],
    '즉각 응답': ['"급한 건이니까 최소한 확���했다는 답이라도 바로 해줬으면…"'],
    '이해와 여유': ['"회의 끝나면 바로 답장하려고 했는데, 그 정도 시간은 기다려줄 수 있지 않나…"'],
    '존중': ['"서로의 시간과 상황을 존중하자는 게 제 마음이에요."'],
  };

  const getEvidence = (node: string) => evidenceMap[node] || ['"관련 원문이 여기에 표시됩니다."'];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <button onClick={onBack} className="hover:text-gray-600 transition-colors">대시보드</button>
            <span>/</span>
            <span className="text-gray-600">시각화</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🗺️</span>
            <h2 className="text-gray-800">갈등 지도</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-4 text-sm text-gray-500 border border-pink-100 rounded-full hover:bg-[#FFF8FA] transition-colors">내보내기</button>
          <button className="h-9 px-4 text-sm text-gray-500 border border-pink-100 rounded-full hover:bg-[#FFF8FA] transition-colors">공유 링크</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-[70%]">
          <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40 overflow-hidden">
            <div className="flex border-b border-pink-50 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedNode(null); setActivePivot(null); }}
                  className={`px-4 py-3.5 text-sm transition-colors relative ${activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: tab.color }} />
                  )}
                </button>
              ))}
            </div>

            <div className="relative p-8 min-h-[480px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full">
                  <VennDiagram data={data} color={currentTab.color} selectedNode={selectedNode} onNodeClick={setSelectedNode} activePivot={activePivot} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-8 pb-8 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-400 mb-1">분기점 (Pivot)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {pivotChips.map((chip, i) => (
                  <button
                    key={chip.label}
                    onClick={() => setActivePivot(activePivot === i ? null : i)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${activePivot === i ? 'shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    style={activePivot === i ? { borderColor: chip.color, color: chip.color, backgroundColor: `${chip.color}08` } : {}}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-[30%]">
          <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(255,107,138,0.06)] border border-pink-100/40 p-6 sticky top-20">
            <h4 className="mb-1 text-gray-800">근거 (원문)</h4>
            <p className="text-xs text-gray-400 mb-6">노드를 클릭하면 관련 원문이 표시돼요</p>

            {selectedNode ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={selectedNode}>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full text-sm mb-3" style={{ backgroundColor: `${currentTab.color}12`, color: currentTab.color }}>{selectedNode}</span>
                </div>
                <div className="space-y-3">
                  {getEvidence(selectedNode).map((e, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF8FA] to-[#FAFAFA] border border-pink-100/30">
                      <p className="text-sm text-gray-600 leading-relaxed">{e}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center mb-4">
                  <span className="text-xl">👆</span>
                </div>
                <p className="text-sm text-gray-400">칩을 클릭해보세요</p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-pink-50">
              <p className="text-xs text-gray-400 leading-relaxed">AI가 요약한 결과예요. 원문도 함께 확인해보세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Venn Diagram ═══════════════════ */
function VennDiagram({ data, color, selectedNode, onNodeClick, activePivot }: {
  data: { personA: string[]; personB: string[]; common: string[] };
  color: string;
  selectedNode: string | null;
  onNodeClick: (node: string) => void;
  activePivot: number | null;
}) {
  const cx = 400, cy = 200, r = 150, offset = 100;

  return (
    <svg viewBox="0 0 800 400" className="w-full max-w-[700px] mx-auto">
      <circle cx={cx - offset} cy={cy} r={r} fill="#FF6B8A" fillOpacity="0.06" stroke="#FF6B8A" strokeOpacity="0.2" strokeWidth="1.5" />
      <circle cx={cx + offset} cy={cy} r={r} fill="#6366F1" fillOpacity="0.06" stroke="#6366F1" strokeOpacity="0.2" strokeWidth="1.5" />
      <text x={cx - offset - r + 20} y={52} fill="#FF6B8A" fontSize="13" fontWeight="500">Person A</text>
      <text x={cx + offset + r - 76} y={52} fill="#6366F1" fontSize="13" fontWeight="500">Person B</text>

      {data.personA.map((chip, i) => {
        const chipX = cx - offset - 70;
        const chipY = cy - 40 + i * 50;
        const isSelected = selectedNode === chip;
        const isHighlighted = activePivot !== null;
        return (
          <g key={`a-${chip}`} onClick={() => onNodeClick(chip)} className="cursor-pointer">
            <line x1={cx - offset} y1={cy} x2={chipX} y2={chipY} stroke="#FF6B8A" strokeOpacity={isSelected ? 0.5 : 0.12} strokeWidth="1" strokeDasharray={isSelected ? '0' : '4 4'} />
            <rect x={chipX - 72} y={chipY - 14} width="144" height="28" rx="14" fill={isSelected ? '#FF6B8A' : 'white'} stroke="#FF6B8A" strokeOpacity={isSelected ? 1 : isHighlighted ? 0.6 : 0.25} strokeWidth={isSelected ? 1.5 : 1} />
            <text x={chipX} y={chipY + 4} textAnchor="middle" fontSize="12" fill={isSelected ? 'white' : '#374151'}>{chip}</text>
          </g>
        );
      })}

      {data.personB.map((chip, i) => {
        const chipX = cx + offset + 70;
        const chipY = cy - 40 + i * 50;
        const isSelected = selectedNode === chip;
        const isHighlighted = activePivot !== null;
        return (
          <g key={`b-${chip}`} onClick={() => onNodeClick(chip)} className="cursor-pointer">
            <line x1={cx + offset} y1={cy} x2={chipX} y2={chipY} stroke="#6366F1" strokeOpacity={isSelected ? 0.5 : 0.12} strokeWidth="1" strokeDasharray={isSelected ? '0' : '4 4'} />
            <rect x={chipX - 72} y={chipY - 14} width="144" height="28" rx="14" fill={isSelected ? '#6366F1' : 'white'} stroke="#6366F1" strokeOpacity={isSelected ? 1 : isHighlighted ? 0.6 : 0.25} strokeWidth={isSelected ? 1.5 : 1} />
            <text x={chipX} y={chipY + 4} textAnchor="middle" fontSize="12" fill={isSelected ? 'white' : '#374151'}>{chip}</text>
          </g>
        );
      })}

      {data.common.map((chip, i) => {
        const chipY = cy - ((data.common.length - 1) * 22) + i * 44;
        const isSelected = selectedNode === chip;
        return (
          <g key={`c-${chip}`} onClick={() => onNodeClick(chip)} className="cursor-pointer">
            <rect x={cx - 64} y={chipY - 14} width="128" height="28" rx="14" fill={isSelected ? '#8B5CF6' : '#F3E8FF'} stroke="#8B5CF6" strokeOpacity={isSelected ? 1 : 0.3} strokeWidth={isSelected ? 1.5 : 1} />
            <text x={cx} y={chipY + 4} textAnchor="middle" fontSize="12" fill={isSelected ? 'white' : '#6B21A8'}>{chip}</text>
          </g>
        );
      })}

      <rect x={cx - 40} y={370} width="80" height="24" rx="12" fill={`${color}15`} />
      <text x={cx} y={386} textAnchor="middle" fontSize="11" fill={color} fontWeight="500">
        {{ FACT: '사실', INTERPRET: '해석', FEEL: '감정', NEED: '요구' }[(['FACT', 'INTERPRET', 'FEEL', 'NEED'] as const).find((k) => data === tabData[k])!]}
      </text>
    </svg>
  );
}
