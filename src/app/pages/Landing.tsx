import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { API_BASE_URL } from "../utils/api";
import { useAuth } from "../utils/authContext";

export function Landing() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    navigate("/home", { replace: true });
  }, [user, isLoading, navigate]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Logo mark */}
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-7 text-4xl"
            style={{
              backgroundColor: "#fff5f7",
              boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.10) 0 4px 8px 0",
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            💬
          </motion.div>

          <p className="text-[32px] font-bold text-[#222222] tracking-tight mb-2">
            티격태격
          </p>
          <p className="text-[15px] text-[#6a6a6a] font-normal leading-relaxed mb-2">
            건강한 갈등 해결의 첫걸음
          </p>
          <p className="text-[13px] text-[#929292] font-normal">
            사실 · 해석 · 감정 · 요구로 갈등을 구조화해요
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-2.5 w-full max-w-[300px] mt-10"
        >
          {[
            { emoji: "👫", label: "두 사람 모드", desc: "갈등 상대방과 함께 분석" },
            { emoji: "🧠", label: "생각 정리 모드", desc: "혼자서 복잡한 감정 정리" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 border border-[#dddddd] text-left"
              style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0" }}
            >
              <span className="text-xl">{item.emoji}</span>
              <div>
                <p className="text-[13.5px] font-semibold text-[#222222]">{item.label}</p>
                <p className="text-[11.5px] text-[#929292]">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="px-6 pb-12 w-full flex flex-col items-center gap-3"
      >
        {/* Google sign-in – Airbnb button-secondary style */}
        <button
          onClick={() => {
            const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.href = `${API_BASE_URL}/auth/google/login?next=${encodeURIComponent(next)}`;
          }}
          className="w-full max-w-[360px] flex items-center justify-center gap-2.5 bg-white text-[#222222] h-14 px-6 rounded-full font-semibold text-[15px] transition-all border border-[#dddddd] hover:border-[#222222] active:scale-[0.98]"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.10) 0 4px 8px 0" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google 계정으로 시작하기
        </button>

        <p className="text-center text-[11px] text-[#929292] mt-1 font-normal">
          가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </motion.div>
    </div>
  );
}
