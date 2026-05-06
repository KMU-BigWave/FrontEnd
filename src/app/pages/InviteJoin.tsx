import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, ArrowLeft } from "lucide-react";
import { api } from "../utils/api";

const MAX_CHARS = 30000;
const DANGER_KEYWORDS = ["자해", "자살", "죽고 싶", "죽고싶", "폭행", "폭력", "살인", "죽이고", "때리", "죽여", "자살하", "자해하", "칼로 찌", "스스로 목숨"];
function hasDanger(text: string) { return DANGER_KEYWORDS.some((kw) => text.includes(kw)); }

export function InviteJoin() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<"welcome" | "pin" | "write">("welcome");
  const [nickname, setNickname] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomData = roomId ? JSON.parse(localStorage.getItem(`room_${roomId}`) || "null") : null;
  const creatorName = roomData?.createdBy || "상대방";

  const handleJoin = () => { if (!nickname.trim()) return; setStep("pin"); };
  const handlePinSubmit = () => {
    if (pinInput.length !== 4) return;
    if (roomData?.pin && pinInput !== roomData.pin) { setPinError(true); return; }
    setPinError(false); setStep("write");
  };
  const handleSubmit = async () => {
    if (!text.trim() || !roomId || isSubmitting) return;
    if (hasDanger(text)) { navigate("/safety"); return; }
    setIsSubmitting(true);
    try {
      await api.joinSession(roomId);
    } catch (error) {
      console.error("세션 참여 실패", error);
      alert("세션 참여에 실패했어요. 백엔드 서버 실행과 로그인 상태를 확인해주세요.");
      setIsSubmitting(false);
      return;
    }
    const data = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
    data.personB = { name: nickname.trim(), text: text.trim() };
    if (data.personA) {
      data.status = "ready";
      localStorage.setItem(`room_${roomId}`, JSON.stringify(data));
      sessionStorage.setItem("analysisData", JSON.stringify({ mode: "two-person", personA: data.personA, personB: data.personB }));
      navigate("/analysis");
    } else {
      data.status = "waiting-a";
      localStorage.setItem(`room_${roomId}`, JSON.stringify(data));
      navigate(`/waiting/${roomId}?role=B`);
    }
    setIsSubmitting(false);
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-5">
        <motion.div className="max-w-[400px] w-full text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <motion.div className="text-4xl mb-6" animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>💌</motion.div>
          <p className="text-[20px] font-bold text-[#222222] mb-1.5 tracking-tight">초대를 받았어요</p>
          <p className="text-[14px] text-[#636366] mb-1 leading-relaxed">
            <span className="text-[#222222] font-semibold">{creatorName}</span>님이 티격태격에 초대했어요.
          </p>
          <p className="text-[12.5px] text-[#929292] mb-10 leading-relaxed">
            각자의 입장을 자유롭게 작성하면, AI가 구조를 분석해 줘요.<br />누가 맞는지는 판단하지 않아요.
          </p>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[13.5px] font-semibold text-[#222222] mb-2">나의 이름 (별명)</label>
              <input type="text"
                className="w-full h-12 px-4 bg-white border border-[#dddddd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] transition-all text-[#222222] placeholder:text-[#929292]"
                placeholder="예: 지영" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
            </div>
            <button disabled={!nickname.trim()} onClick={handleJoin}
              className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] active:scale-[0.98] transition-all font-semibold">
              참여하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-5">
        <motion.div className="max-w-[360px] w-full text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div className="w-16 h-16 rounded-2xl bg-[#fff5f7] flex items-center justify-center mx-auto mb-6" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <Lock className="w-6 h-6 text-[#c9485b]" />
          </motion.div>
          <p className="text-[20px] font-bold text-[#222222] mb-1.5 tracking-tight">비밀번호 입력</p>
          <p className="text-[12.5px] text-[#929292] mb-8">{creatorName}님이 설정한 숫자 4자리를 입력해주세요</p>
          <div className="mb-6">
            <div className="flex justify-center gap-3 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${pinInput[i] ? "border-[#ffd1da] bg-[#fff5f7]" : pinError ? "border-red-300 bg-red-50" : "border-[#dddddd] bg-white"}`}>
                  {pinInput[i] && <span className="text-[#c9485b] text-lg">•</span>}
                </div>
              ))}
            </div>
            <input type="text" inputMode="numeric" autoFocus className="opacity-0 absolute w-0 h-0"
              value={pinInput} onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && pinInput.length === 4) handlePinSubmit(); }} />
            <button className="text-[12px] text-[#929292] mt-1" onClick={() => (document.querySelector('input[inputMode="numeric"]') as HTMLInputElement)?.focus()}>
              {pinError ? <span className="text-red-400">비밀번호가 틀렸어요. 다시 입력해주세요</span> : "숫자를 입력해주세요"}
            </button>
          </div>
          <button disabled={pinInput.length !== 4} onClick={handlePinSubmit}
            className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] active:scale-[0.98] transition-all font-semibold">
            확인
          </button>
          <button onClick={() => { setStep("welcome"); setPinInput(""); setPinError(false); }} className="mt-4 text-[12.5px] text-[#929292] hover:text-[#636366] transition-colors">← 뒤로</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
        <div className="mx-auto max-w-[560px] px-5 h-14 flex items-center">
          <button onClick={() => setStep("pin")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors">
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-5 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pt-7 mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fff5f7] rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
              <span className="text-[11.5px] text-[#c9485b] font-semibold">{creatorName}님과의 갈등 분석</span>
            </div>
            <p className="text-[17px] font-bold text-[#222222] mb-1 tracking-tight">{nickname}님의 이야기</p>
            <p className="text-[12.5px] text-[#929292]">어떤 상황이었는지, 자유롭게 적어주세요</p>
          </div>
          <div className="relative mb-4">
            <textarea
              className="w-full min-h-[360px] px-4 py-4 bg-white border border-[#dddddd] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] resize-none transition-all text-[#222222] placeholder:text-[#929292] text-[14px] leading-relaxed"
              placeholder={`자유롭게 작성해주세요.\n\n• 있었던 사실\n• 나의 해석\n• 느꼈던 감정\n• 바라는 것`}
              value={text} onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }} />
            <div className="absolute bottom-3 right-4 text-[10.5px] text-[#929292]">{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</div>
          </div>
          <button disabled={!text.trim() || isSubmitting} onClick={handleSubmit}
            className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] active:scale-[0.98] transition-all font-semibold">
            {isSubmitting ? "저장 중..." : "작성 완료"}
          </button>
        </motion.div>
      </main>
    </div>
  );
}