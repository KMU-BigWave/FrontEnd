import { motion } from 'motion/react';
import {
  PersonAnalysis,
  AnalysisItem,
  getCategoryColor,
  getCategoryBg,
  getCategoryLabel,
} from '../utils/analysisEngine';

interface ConflictVisualizationProps {
  personA?: PersonAnalysis;
  personB?: PersonAnalysis;
  solo?: PersonAnalysis;
  sharedFacts: AnalysisItem[];
  commonFacts: string[];
  commonKeywords?: string[];
  onItemClick: (item: AnalysisItem, person: string) => void;
}

/* ═══════════════════════════════════════════════════════
   TWO-PERSON UNIFIED DIAGRAM
   One single card containing:
     Top    → 공통 사실
     Middle → 공통 인식 (Venn)
     Bottom → A의 해석/감정/요구 ←→ B의 해석/감정/요구
   ═══════════════════════════════════════════════════════ */
function UnifiedTwoPersonDiagram({
  personA,
  personB,
  sharedFacts,
  commonFacts,
  onItemClick,
}: {
  personA: PersonAnalysis;
  personB: PersonAnalysis;
  sharedFacts: AnalysisItem[];
  commonFacts: string[];
  onItemClick: (item: AnalysisItem, person: string) => void;
}) {
  const categories: ('interpretation' | 'emotion' | 'need')[] = [
    'interpretation',
    'emotion',
    'need',
  ];

  return (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* ──── Top: Shared Facts ──── */}
      {sharedFacts.length > 0 && (
        <div className="px-5 md:px-10 pt-8 pb-6">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="h-px flex-1 bg-indigo-100" />
            <div className="px-4 py-1.5 rounded-full text-xs flex items-center gap-2 bg-[#EEF2FF] text-[#6366F1]">
              <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
              공통 사실
            </div>
            <div className="h-px flex-1 bg-indigo-100" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {sharedFacts.map((fact, i) => (
              <motion.button
                key={fact.id}
                onClick={() => onItemClick(fact, '공통')}
                className="px-4 py-2 rounded-full text-sm text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors hover:shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                {fact.text}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ──── Connector line from facts to venn ──── */}
      {sharedFacts.length > 0 && commonFacts.length > 0 && (
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gray-200" />
        </div>
      )}

      {/* ──── Middle: Common Recognition Venn ──── */}
      {commonFacts.length > 0 && (
        <div className="px-5 md:px-10 py-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 bg-purple-100" />
            <div className="px-4 py-1.5 rounded-full text-xs flex items-center gap-2 bg-[#F3E8FF] text-[#8B5CF6]">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              공통 인식
            </div>
            <div className="h-px flex-1 bg-purple-100" />
          </div>

          <div className="flex justify-center">
            <svg
              width="280"
              height="140"
              viewBox="0 0 280 140"
              className="max-w-full"
            >
              <motion.circle
                cx="105" cy="70" r="60"
                fill="#FF6B8A" fillOpacity="0.06"
                stroke="#FF6B8A" strokeWidth="1.5" strokeOpacity="0.25"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.circle
                cx="175" cy="70" r="60"
                fill="#6366F1" fillOpacity="0.06"
                stroke="#6366F1" strokeWidth="1.5" strokeOpacity="0.25"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              <motion.ellipse
                cx="140" cy="70" rx="30" ry="48"
                fill="#8B5CF6" fillOpacity="0.1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              />
              <text x="60" y="73" textAnchor="middle" fill="#FF6B8A" fontSize="12" fontWeight="600">
                {personA.name}
              </text>
              <text x="220" y="73" textAnchor="middle" fill="#6366F1" fontSize="12" fontWeight="600">
                {personB.name}
              </text>
              {commonFacts.slice(0, 3).map((fact, i) => (
                <text
                  key={i}
                  x="140"
                  y={60 + i * 16}
                  textAnchor="middle"
                  fill="#4C1D95"
                  fontSize="10"
                  fontWeight="500"
                >
                  {fact.length > 8 ? fact.substring(0, 8) + '…' : fact}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {commonFacts.map((fact, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs bg-[#F3E8FF] text-[#6D28D9]"
              >
                {fact}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ──── Connector line from venn to mind map ──── */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-gray-200" />
      </div>

      {/* ──── Bottom: Mind Map — A left ←→ B right ──── */}
      <div className="px-5 md:px-10 pb-8">
        {/* Person labels at top */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FF6B8A] flex items-center justify-center text-white text-sm shadow-sm">
              {personA.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-600">{personA.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{personB.name}</span>
            <div className="w-9 h-9 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm shadow-sm">
              {personB.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Category rows */}
        <div className="space-y-5">
          {categories.map((cat, ci) => {
            const color = getCategoryColor(cat);
            const bg = getCategoryBg(cat);
            const label = getCategoryLabel(cat);
            const itemsA = personA.items.filter((i) => i.category === cat);
            const itemsB = personB.items.filter((i) => i.category === cat);
            if (itemsA.length === 0 && itemsB.length === 0) return null;

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + ci * 0.1 }}
              >
                {/* Category label centered */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
                  <div
                    className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5"
                    style={{ backgroundColor: `${color}12`, color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                  <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
                </div>

                {/* Two columns: A items (left-aligned) ← → B items (right-aligned) */}
                <div className="flex gap-3 md:gap-6">
                  {/* Person A items */}
                  <div className="flex-1 space-y-1.5">
                    {itemsA.map((item, i) => (
                      <motion.div
                        key={item.id}
                        className="flex items-center gap-1.5"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + ci * 0.1 + i * 0.05 }}
                      >
                        <div
                          className="w-3 md:w-5 h-px flex-shrink-0"
                          style={{ backgroundColor: '#FF6B8A40' }}
                        />
                        <button
                          onClick={() => onItemClick(item, personA.name)}
                          className="px-3 py-1.5 rounded-full text-xs md:text-sm text-gray-700 hover:shadow-md transition-all hover:scale-[1.03] border border-transparent hover:border-gray-200 text-left"
                          style={{ backgroundColor: bg }}
                        >
                          {item.keywords[0]}
                          <span className="text-gray-400 ml-1 hidden lg:inline">
                            · {item.text.length > 18 ? item.text.substring(0, 18) + '…' : item.text}
                          </span>
                        </button>
                      </motion.div>
                    ))}
                    {itemsA.length === 0 && (
                      <span className="text-xs text-gray-300 italic px-3">—</span>
                    )}
                  </div>

                  {/* Center divider dot */}
                  <div className="flex items-center">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: `${color}50` }}
                    />
                  </div>

                  {/* Person B items */}
                  <div className="flex-1 space-y-1.5">
                    {itemsB.map((item, i) => (
                      <motion.div
                        key={item.id}
                        className="flex items-center justify-end gap-1.5"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + ci * 0.1 + i * 0.05 }}
                      >
                        <button
                          onClick={() => onItemClick(item, personB.name)}
                          className="px-3 py-1.5 rounded-full text-xs md:text-sm text-gray-700 hover:shadow-md transition-all hover:scale-[1.03] border border-transparent hover:border-gray-200 text-right"
                          style={{ backgroundColor: bg }}
                        >
                          <span className="text-gray-400 mr-1 hidden lg:inline">
                            {item.text.length > 18 ? item.text.substring(0, 18) + '…' : item.text} ·
                          </span>
                          {item.keywords[0]}
                        </button>
                        <div
                          className="w-3 md:w-5 h-px flex-shrink-0"
                          style={{ backgroundColor: '#6366F140' }}
                        />
                      </motion.div>
                    ))}
                    {itemsB.length === 0 && (
                      <span className="text-xs text-gray-300 italic px-3 text-right block">—</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SOLO UNIFIED DIAGRAM
   One single card with all categories branching from center
   ═══════════════════════════════════════════════════════ */
function UnifiedSoloDiagram({
  solo,
  onItemClick,
}: {
  solo: PersonAnalysis;
  onItemClick: (item: AnalysisItem, person: string) => void;
}) {
  const categories: ('fact' | 'interpretation' | 'emotion' | 'need')[] = [
    'fact',
    'interpretation',
    'emotion',
    'need',
  ];

  return (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-white overflow-hidden px-5 md:px-10 py-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Center node */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="w-14 h-14 rounded-full bg-[#FF6B8A] flex items-center justify-center text-white shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          나
        </motion.div>
      </div>

      {/* Connector from center */}
      <div className="flex justify-center mb-4">
        <div className="w-px h-4 bg-gray-200" />
      </div>

      {/* Category branches */}
      <div className="space-y-5">
        {categories.map((cat, ci) => {
          const items = solo.items.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const color = getCategoryColor(cat);
          const bg = getCategoryBg(cat);
          const label = getCategoryLabel(cat);

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + ci * 0.08 }}
            >
              {/* Category label */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
                <div
                  className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5"
                  style={{ backgroundColor: `${color}12`, color }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
                <div className="h-px flex-1" style={{ backgroundColor: `${color}25` }} />
              </div>

              {/* Item bubbles */}
              <div className="flex flex-wrap gap-2 justify-center">
                {items.map((item, i) => (
                  <motion.button
                    key={item.id}
                    onClick={() => onItemClick(item, '나')}
                    className="px-3 py-2 rounded-full text-xs md:text-sm text-gray-700 hover:shadow-md transition-all hover:scale-[1.03] border border-transparent hover:border-gray-200"
                    style={{ backgroundColor: bg }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + ci * 0.08 + i * 0.04 }}
                  >
                    {item.keywords[0]}
                    <span className="text-gray-400 ml-1.5 hidden md:inline">
                      · {item.text.length > 20 ? item.text.substring(0, 20) + '…' : item.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════ */
export function ConflictVisualization({
  personA,
  personB,
  solo,
  sharedFacts,
  commonFacts,
  commonKeywords,
  onItemClick,
}: ConflictVisualizationProps) {
  if (personA && personB) {
    return (
      <UnifiedTwoPersonDiagram
        personA={personA}
        personB={personB}
        sharedFacts={sharedFacts}
        commonFacts={commonFacts}
        onItemClick={onItemClick}
      />
    );
  }

  if (solo) {
    return <UnifiedSoloDiagram solo={solo} onItemClick={onItemClick} />;
  }

  return null;
}
