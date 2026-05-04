import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Home, AlertCircle } from "lucide-react";

export function SafetyAlert() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-[360px] w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <motion.div
          className="w-16 h-16 bg-[#fff5f7] border border-[#ffd1da] rounded-2xl flex items-center justify-center mx-auto mb-7"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AlertCircle size={28} className="text-[#c9485b]" strokeWidth={1.8} />
        </motion.div>

        {/* Heading */}
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold text-[#c9485b] uppercase tracking-widest mb-3">
            분석 불가
          </p>
          <p className="text-[22px] font-bold text-[#222222] tracking-tight mb-4 leading-snug">
            이 내용으로는<br />분석을 진행할 수 없어요
          </p>
          <p className="text-[14px] text-[#6a6a6a] leading-relaxed">
            작성하신 텍스트에 분석이 제한되는<br />내용이 포함되어 있어요.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#dddddd] mb-7" />

        {/* Explanation */}
        <div className="space-y-3 mb-8">
          {[
            { icon: "✏️", text: "텍스트를 다시 작성해주세요" },
            { icon: "🔍", text: "분석하려는 갈등의 사실·감정·요구 중심으로 적어주세요" },
            { icon: "🤝", text: "티격태격은 건강한 갈등 해결을 위한 서비스예요" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3 px-4 py-3 bg-[#f7f7f7] rounded-xl border border-[#dddddd]">
              <span className="text-lg mt-0.5">{item.icon}</span>
              <p className="text-[13px] text-[#3f3f3f] leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Back to home */}
        <button
          onClick={() => navigate("/home")}
          className="w-full flex items-center justify-center gap-2 h-12 bg-[#ffd1da] text-[#222222] rounded-full font-semibold hover:bg-[#ffb3c4] active:scale-[0.98] transition-all"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.06) 0 2px 6px 0" }}
        >
          <Home size={16} strokeWidth={2} />
          홈으로 돌아가기
        </button>
      </motion.div>
    </div>
  );
}
