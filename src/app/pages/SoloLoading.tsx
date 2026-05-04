import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  { emoji: "📝", text: "텍스트 분석 중..." },
  { emoji: "🔍", text: "사실 · 해석 · 감정 · 요구 분류 중..." },
  { emoji: "💡", text: "핵심 패턴 감지 중..." },
  { emoji: "✨", text: "AI 생각 정리 구성 중..." },
];

const TOTAL_MS = 3200;

export function SoloLoading() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepInterval = TOTAL_MS / STEPS.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentStep(i), stepInterval * i));
    });

    const navTimer = setTimeout(() => {
      navigate("/solo-analysis", { replace: true });
    }, TOTAL_MS + 400);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-[340px] w-full text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated brain icon */}
        <motion.div
          className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#EBEBF0]"
          animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-4xl">🧠</span>
        </motion.div>

        <p className="text-[20px] font-bold text-[#222222] mb-2 tracking-tight">
          생각 정리 중이에요
        </p>
        <p className="text-[13.5px] text-[#6a6a6a] mb-10 font-normal leading-relaxed">
          AI가 당신의 이야기를 분석하고 있어요.<br />잠시만 기다려 주세요.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-[#EBEBF0] rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#ffd1da" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <AnimatePresence key={i}>
              {i <= currentStep && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#EBEBF0]"
                >
                  <span className="text-lg">{step.emoji}</span>
                  <span className="text-[13px] text-[#3f3f3f]">{step.text}</span>
                  {i < currentStep && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-[#5BB89A] text-[13px]"
                    >
                      ✓
                    </motion.span>
                  )}
                  {i === currentStep && (
                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.div
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
