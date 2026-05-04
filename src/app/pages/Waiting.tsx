import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function WaitingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"waiting_partner" | "analyzing">("waiting_partner");

  useEffect(() => {
    // Simulate waiting for partner (3s) then AI analyzing (3s)
    const partnerTimer = setTimeout(() => {
      setStep("analyzing");
      
      const analysisTimer = setTimeout(() => {
        navigate("/analysis");
      }, 3500);
      
      return () => clearTimeout(analysisTimer);
    }, 4000);
    
    return () => clearTimeout(partnerTimer);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white min-h-screen relative overflow-hidden">
      {/* Background animated gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full mix-blend-screen blur-[100px] animate-[pulse_4s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/15 rounded-full mix-blend-screen blur-[100px] animate-[pulse_5s_ease-in-out_infinite_reverse]"></div>

      <div className="relative z-10 flex flex-col items-center min-h-[300px] justify-center">
        <AnimatePresence mode="wait">
          {step === "waiting_partner" ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-slate-800 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center relative z-10">
                  <Users size={36} className="text-slate-400" strokeWidth={1.5} />
                </div>
                {/* Ping rings */}
                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-slate-600 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight mb-3">상대방의 입력을 기다리고 있어요</h2>
              <p className="text-slate-400 text-[15px] font-medium text-center max-w-[260px] leading-relaxed">
                두 사람 모두 갈등 텍스트를 입력해야<br />
                분석 대시보드가 생성됩니다
              </p>
              
              {/* Fake progress dots */}
              <div className="flex gap-2 mt-10">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-[28px] shadow-[0_0_40px_rgba(139,92,246,0.35)] flex items-center justify-center animate-[bounce_2s_ease-in-out_infinite]">
                  <Sparkles size={40} className="text-white" strokeWidth={1.5} />
                </div>
                {/* Orbital rings */}
                <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-violet-400/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 w-56 h-56 border border-fuchsia-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_6s_linear_infinite_reverse]"></div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight mb-3">AI가 분석 중입니다</h2>
              <p className="text-slate-400 text-[15px] font-medium text-center max-w-[260px] leading-relaxed">
                두 사람의 마음을 조율하여<br />
                객관적인 갈등 구조를 그리고 있어요
              </p>

              {/* Progress bar */}
              <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-10 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}