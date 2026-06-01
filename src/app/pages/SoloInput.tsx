import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Brain } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../utils/api";
import { useAuth } from "../utils/authContext";

const MAX_CHARS = 30000;

const DANGER_KEYWORDS = ["자해", "자살", "죽고 싶", "죽고싶", "폭행", "폭력", "살인", "죽이고", "때리", "죽여", "자살하", "자해하", "칼로 찌", "스스로 목숨"];

function hasDanger(text: string) {
  return DANGER_KEYWORDS.some((kw) => text.includes(kw));
}

export function SoloInput() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const rawText = text.trim();
    if (rawText.length < 10 || isSubmitting) return;
    if (hasDanger(rawText)) { navigate("/safety"); return; }

    setIsSubmitting(true);
    try {
      const session = await api.createSession({
        relationshipType: "OTHER",
        mode: "SINGLE",
        roomPassword: "0000",
        nickname: user?.name || "나",
      });
      await api.submitInput(session.id, rawText);
      sessionStorage.setItem("soloData", JSON.stringify({ text: rawText, sessionId: session.id }));
      navigate("/solo-loading");
    } catch (error) {
      const apiError = error as { code?: string; message?: string };
      if (apiError.code === "INPUT_BLOCKED") {
        navigate("/safety");
        return;
      }
      console.error("생각 정리 입력 저장 실패", error);
      alert(apiError.message ?? "입력 저장에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
        <div className="mx-auto max-w-[1120px] px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
          <span className="text-[15px] font-bold text-[#222222] tracking-tight">생각 정리 모드</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Intro */}
          <div className="pt-7 pb-6">
            <div className="w-12 h-12 bg-[#fff5f7] rounded-2xl flex items-center justify-center mb-4">
              <Brain size={22} className="text-[#c9485b]" />
            </div>
            <p className="text-[20px] font-bold text-[#222222] mb-1.5 tracking-tight">
              지금의 생각을 정리해볼게요
            </p>
            <p className="text-[13.5px] text-[#636366] leading-relaxed">
              어떤 상황인지, 어떤 감정인지 자유롭게 적어주세요.
              <br />
              AI가 사실·해석·감정·요구로 구조화하고 정리해드려요.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-[#fff5f7] rounded-2xl p-4 mb-4 border border-[#ffd1da]/50">
            <p className="text-[12px] font-semibold text-[#c9485b] mb-2">💡 이렇게 적으면 더 정확해요</p>
            <div className="space-y-1">
              {[
                "실제로 있었던 일 (사실)",
                "그 상황을 어떻게 받아들였는지 (해석)",
                "그때 어떤 기분이었는지 (감정)",
                "무엇을 원하는지, 바라는 것 (요구)",
              ].map((tip) => (
                <p key={tip} className="text-[12px] text-[#636366] flex items-start gap-1.5">
                  <span className="text-[#c9485b] mt-0.5">·</span>
                  {tip}
                </p>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative mb-4">
            <textarea
              className="w-full min-h-[360px] px-4 py-4 bg-white border border-[#dddddd] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] resize-none transition-all text-[#222222] placeholder:text-[#929292] text-[14px] leading-relaxed"
              placeholder={`예시) 친구가 약속 시간에 30분 늦었는데 미안하다는 말 한마디도 없이 그냥 넘어갔어. 이번이 세 번째인데 매번 이런 식이야. 기다리면서 화가 나기도 하고...`}
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
              }}
            />
            <div className="absolute bottom-3 right-4 text-[10.5px] text-[#929292]">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </div>
          </div>

          <button
            disabled={text.trim().length < 10 || isSubmitting}
            onClick={handleSubmit}
            className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] active:scale-[0.98] transition-all font-semibold"
          >
            {isSubmitting ? "저장 중..." : text.trim().length < 10 ? "10자 이상 작성해주세요" : "AI로 생각 정리하기"}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
