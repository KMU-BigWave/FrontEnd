import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../utils/api";

export const SOLO_LOADING_STEPS = [
  { emoji: "📝", text: "텍스트 분석 중..." },
  { emoji: "🔍", text: "사실 · 해석 · 감정 · 요구 분류 중..." },
  { emoji: "💡", text: "핵심 패턴 감지 중..." },
  { emoji: "✨", text: "AI 생각 정리 구성 중..." },
];

export function SoloAnalysisLoadingView({
  currentStep,
  fullScreen = true,
}: {
  currentStep: number;
  fullScreen?: boolean;
}) {
  const safeStep = Math.min(currentStep, SOLO_LOADING_STEPS.length - 1);
  const progress = ((safeStep + 1) / SOLO_LOADING_STEPS.length) * 100;

  return (
    <div className={`${fullScreen ? "min-h-screen" : "min-h-[520px]"} bg-[#F5F5F7] flex flex-col items-center justify-center px-6`}>
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
          {SOLO_LOADING_STEPS.map((step, i) => (
            <AnimatePresence key={i}>
              {i <= safeStep && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#EBEBF0]"
                >
                  <span className="text-lg">{step.emoji}</span>
                  <span className="text-[13px] text-[#3f3f3f]">{step.text}</span>
                  {i < safeStep && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-[#5BB89A] text-[13px]"
                    >
                      ✓
                    </motion.span>
                  )}
                  {i === safeStep && (
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

export function SoloLoading() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const stepTimer = setInterval(() => {
      setCurrentStep((step) => Math.min(step + 1, SOLO_LOADING_STEPS.length - 1));
    }, 900);

    const stored = sessionStorage.getItem("soloData");
    const parsed = stored ? JSON.parse(stored) as { sessionId?: string } : null;

    if (!parsed?.sessionId) {
      pollTimer = setTimeout(() => navigate("/solo-analysis", { replace: true }), 3600);
    } else {
      let attempts = 0;
      const poll = async () => {
        if (cancelled || !parsed.sessionId) return;
        attempts += 1;

        try {
          const status = await api.getAnalysisStatus(parsed.sessionId);
          if (status.status === "DONE" || status.status === "FAILED" || status.status === "BLOCKED") {
            navigate("/solo-analysis", { replace: true });
            return;
          }
        } catch (error) {
          console.error("생각 정리 분석 상태 확인 실패", error);
        }

        if (attempts >= 20) {
          navigate("/solo-analysis", { replace: true });
          return;
        }

        pollTimer = setTimeout(poll, 2000);
      };

      void poll();
    }

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [navigate]);

  return <SoloAnalysisLoadingView currentStep={currentStep} />;
}
