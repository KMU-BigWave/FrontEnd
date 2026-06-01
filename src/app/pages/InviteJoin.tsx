import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { api, API_BASE_URL } from "../utils/api";
import { useAuth } from "../utils/authContext";

const MAX_CHARS = 30000;
const DANGER_KEYWORDS = ["자해", "자살", "죽고 싶", "죽고싶", "폭행", "폭력", "살인", "죽이고", "때리", "죽여", "자살하", "자해하", "칼로 찌", "스스로 목숨"];
function hasDanger(text: string) { return DANGER_KEYWORDS.some((kw) => text.includes(kw)); }

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function InviteJoin() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();

  // 초대 링크의 ?from= 쿼리파라미터로 방 개설자 이름 표시
  const urlCreatorName = searchParams.get("from");
  const roomData = roomId ? JSON.parse(localStorage.getItem(`room_${roomId}`) || "null") : null;
  const creatorName = urlCreatorName || roomData?.createdBy || "상대방";

  // 이름 → 비밀번호 → 작성 순서
  const [step, setStep] = useState<"name" | "pin" | "write">("name");
  const [nickname, setNickname] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 비로그인: 로그인 먼저 ───────────────────────────────
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center px-5">
        <motion.div
          className="max-w-[400px] w-full text-center"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <motion.div className="text-4xl mb-6" animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            💌
          </motion.div>
          <p className="text-[20px] font-bold text-[#1A1C2E] mb-2 tracking-tight">초대를 받았어요</p>
          <p className="text-[14px] text-[#565C7A] mb-1 leading-relaxed">
            <span className="font-semibold text-[#1A1C2E]">{creatorName}</span>님이 티격태격에 초대했어요.
          </p>
          <p className="text-[12.5px] text-[#9BA3BE] mb-8 leading-relaxed">
            로그인 후 이름과 비밀번호를 입력하면 참여할 수 있어요.
          </p>
          <button
            onClick={() => {
              const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
              localStorage.setItem("pendingInvite", next);
              window.location.href = `${API_BASE_URL}/auth/google/login?next=${encodeURIComponent(next)}`;
            }}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-[#222222] h-14 px-6 rounded-full font-semibold text-[15px] border border-[#dddddd] hover:border-[#222222] active:scale-[0.98] transition-all"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0 2px 8px 0" }}
          >
            <GoogleIcon />
            Google 계정으로 로그인
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  // ── step: 이름 입력 ───────────────────────────────────
  if (step === "name") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center px-5">
        <motion.div className="max-w-[400px] w-full text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div className="text-4xl mb-5" animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            💌
          </motion.div>
          <p className="text-[20px] font-bold text-[#1A1C2E] mb-1.5 tracking-tight">
            <span className="text-[#8B8FCC]">{creatorName}</span>님이 초대했어요
          </p>
          <p className="text-[12.5px] text-[#9BA3BE] mb-8">분석 결과에 표시될 이름을 입력해주세요</p>
          <div className="space-y-3 text-left">
            <input
              type="text" autoFocus
              className="w-full h-12 px-4 bg-white border border-[#E5E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8CAE8]/60 focus:border-[#8B8FCC] transition-all text-[#1A1C2E] placeholder:text-[#9BA3BE]"
              placeholder="예: 지영"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && nickname.trim()) setStep("pin"); }}
              maxLength={20}
            />
            <button
              disabled={!nickname.trim()}
              onClick={() => setStep("pin")}
              className="w-full h-12 text-white rounded-xl active:scale-[0.98] transition-all font-semibold disabled:cursor-not-allowed"
              style={nickname.trim() ? { background: "#8B8FCC" } : { background: "#E5E8F0", color: "#9BA3BE" }}
            >
              다음
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── step: PIN 입력 ────────────────────────────────────
  const handlePinSubmit = async () => {
    if (pinInput.length !== 4 || !roomId) return;
    try {
      await api.joinSession(roomId, pinInput, nickname.trim());
      setPinError(false);
      setStep("write");
    } catch (error) {
      const e = error as { code?: string };
      if (e.code === "INVALID_ROOM_PASSWORD") setPinError(true);
      else if (e.code === "ALREADY_JOINED") setStep("write");
      else alert((error as { message?: string }).message ?? "세션 참여 실패");
    }
  };

  if (step === "pin") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center px-5">
        <motion.div className="max-w-[360px] w-full text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div className="text-4xl mb-6" animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>🔒</motion.div>
          <p className="text-[20px] font-bold text-[#1A1C2E] mb-1.5 tracking-tight">비밀번호를 입력해주세요</p>
          <p className="text-[12.5px] text-[#9BA3BE] mb-8">
            <span className="font-semibold text-[#1A1C2E]">{creatorName}</span>님이 설정한 숫자 4자리
          </p>
          <div className="mb-6">
            <div className="flex justify-center gap-3 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all
                  ${pinInput[i] ? "border-[#8B8FCC] bg-[#EEEEF9]" : pinError ? "border-red-300 bg-red-50" : "border-[#E5E8F0] bg-white"}`}>
                  {pinInput[i] && <span className="text-[#8B8FCC] text-lg">•</span>}
                </div>
              ))}
            </div>
            <input
              type="text" inputMode="numeric" autoFocus
              className="opacity-0 absolute w-0 h-0"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && pinInput.length === 4) handlePinSubmit(); }}
            />
            {pinError && <p className="text-[12px] text-red-400 mt-1">비밀번호가 틀렸어요</p>}
          </div>
          <button
            disabled={pinInput.length !== 4}
            onClick={handlePinSubmit}
            className="w-full h-12 text-white rounded-xl active:scale-[0.98] transition-all font-semibold disabled:cursor-not-allowed"
            style={pinInput.length === 4 ? { background: "#8B8FCC" } : { background: "#E5E8F0", color: "#9BA3BE" }}
          >
            확인
          </button>
          <button onClick={() => setStep("name")} className="mt-4 text-[12px] text-[#9BA3BE] hover:text-[#565C7A] transition-colors">
            <ArrowLeft className="inline w-3.5 h-3.5 mr-1" />뒤로
          </button>
        </motion.div>
      </div>
    );
  }

  // ── step: 갈등 텍스트 작성 ────────────────────────────
  const handleSubmit = async () => {
    if (!text.trim() || !roomId || isSubmitting) return;
    if (hasDanger(text)) { navigate("/safety"); return; }
    setIsSubmitting(true);

    try {
      await api.submitInput(roomId, text.trim());
    } catch (error) {
      const e = error as { code?: string; message?: string };
      if (e.code === "INPUT_BLOCKED") { navigate("/safety"); return; }
      alert(e.message ?? "입력 저장에 실패했어요.");
      setIsSubmitting(false);
      return;
    }

    const bName = nickname.trim() || user.name || "B";
    const data = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
    data.personB = { name: bName, text: text.trim() };
    localStorage.setItem(`room_${roomId}`, JSON.stringify(data));

    const existing = JSON.parse(sessionStorage.getItem("analysisData") || "{}");
    sessionStorage.setItem("analysisData", JSON.stringify({
      ...existing,
      mode: "two-person",
      sessionId: roomId,
      personA: { name: creatorName },
      personB: { name: bName },
      myRole: "B",
    }));

    navigate(`/waiting/${roomId}?role=B`);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <header className="bg-white border-b border-[#E5E8F0] sticky top-0 z-20">
        <div className="mx-auto max-w-[1120px] px-5 h-14 flex items-center">
          <button onClick={() => setStep("pin")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F6F7FB] transition-colors">
            <ArrowLeft className="w-[18px] h-[18px] text-[#565C7A]" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-5 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pt-7 mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEEEF9] rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B8FCC]" />
              <span className="text-[11.5px] text-[#8B8FCC] font-semibold">{creatorName}님과의 갈등 분석</span>
            </div>
            <p className="text-[17px] font-bold text-[#1A1C2E] mb-1 tracking-tight">{nickname || user.name}님의 이야기</p>
            <p className="text-[12.5px] text-[#9BA3BE]">어떤 상황이었는지, 자유롭게 적어주세요</p>
          </div>
          <div className="relative mb-4">
            <textarea
              className="w-full min-h-[360px] px-4 py-4 bg-white border border-[#E5E8F0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C8CAE8]/60 focus:border-[#8B8FCC] resize-none transition-all text-[#1A1C2E] placeholder:text-[#9BA3BE] text-[14px] leading-relaxed"
              placeholder={`자유롭게 작성해주세요.\n\n• 있었던 사실\n• 나의 해석\n• 느꼈던 감정\n• 바라는 것`}
              value={text}
              onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
            />
            <div className="absolute bottom-3 right-4 text-[10.5px] text-[#9BA3BE]">{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</div>
          </div>
          <button
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="w-full h-12 text-white rounded-xl active:scale-[0.98] transition-all font-semibold"
            style={text.trim() && !isSubmitting ? { background: "#8B8FCC" } : { background: "#E5E8F0", color: "#9BA3BE" }}
          >
            {isSubmitting ? "저장 중..." : "작성 완료"}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
