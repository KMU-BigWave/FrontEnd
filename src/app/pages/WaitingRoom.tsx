import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";

const STEPS_A = [
  { emoji: "✅", text: "내 입장 작성 완료" },
  { emoji: "🔗", text: "상대방이 초대 링크로 참여 중..." },
  { emoji: "✍️", text: "상대방 작성 완료를 기다리는 중..." },
];

const STEPS_B = [
  { emoji: "✅", text: "내 입장 작성 완료" },
  { emoji: "⏳", text: "상대방 작성 완료를 기다리는 중..." },
  { emoji: "✨", text: "곧 분석이 시작돼요..." },
];

export function WaitingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [personADone, setPersonADone] = useState(false);
  const [personBDone, setPersonBDone] = useState(false);
  const [readyToGo, setReadyToGo] = useState(false);

  const role = searchParams.get("role") || "A";
  const steps = role === "A" ? STEPS_A : STEPS_B;
  const inviteLink = `${window.location.origin}/invite/${roomId}`;

  /* poll localStorage for partner completion */
  useEffect(() => {
    const check = () => {
      if (!roomId) return false;
      const data = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
      setPersonADone(!!data.personA);
      setPersonBDone(!!data.personB);
      if (data.personA && data.personB) {
        sessionStorage.setItem(
          "analysisData",
          JSON.stringify({ mode: "two-person", personA: data.personA, personB: data.personB })
        );
        setReadyToGo(true);
        setTimeout(() => navigate("/analysis"), 1000);
        return true;
      }
      return false;
    };

    if (!check()) {
      const iv = setInterval(() => { if (check()) clearInterval(iv); }, 1500);
      return () => clearInterval(iv);
    }
  }, [roomId, navigate]);

  /* step cycle — only while waiting */
  useEffect(() => {
    if (readyToGo) { setCurrentStep(steps.length - 1); return; }
    const iv = setInterval(() => {
      setCurrentStep((p) => Math.min(p + 1, steps.length - 2));
    }, 2400);
    return () => clearInterval(iv);
  }, [steps.length, readyToGo]);

  useEffect(() => {
    if (readyToGo) setCurrentStep(steps.length - 1);
  }, [readyToGo, steps.length]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(inviteLink); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDemoSkip = () => {
    if (!roomId) return;
    const data = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
    if (!data.personA) data.personA = { name: "사용자 A", text: "어제 약속 시간에 30분 늦게 도착했다." };
    if (!data.personB) data.personB = { name: "사용자 B", text: "회의가 길어져서 약속에 늦었다." };
    data.status = "ready";
    localStorage.setItem(`room_${roomId}`, JSON.stringify(data));
    sessionStorage.setItem(
      "analysisData",
      JSON.stringify({ mode: "two-person", personA: data.personA, personB: data.personB })
    );
    navigate("/analysis");
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-[340px] w-full text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon — same pattern as SoloLoading */}
        <motion.div
          className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.10) 0 4px 8px 0" }}
          animate={
            readyToGo
              ? { scale: [1, 1.1, 1] }
              : { rotate: [0, 4, -4, 0], scale: [1, 1.03, 1] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {readyToGo ? "✨" : "⏳"}
        </motion.div>

        <p className="text-[20px] font-bold text-[#222222] mb-2 tracking-tight">
          {readyToGo ? "분석 시작할게요!" : "상대방을 기다리고 있어요"}
        </p>
        <p className="text-[13.5px] text-[#6a6a6a] mb-10 font-normal leading-relaxed">
          {readyToGo
            ? "두 분 모두 작성이 완료되었어요.\n대시보드로 이동 중이에요."
            : role === "A"
              ? "상대가 초대 링크로 참여하고 작성을 마치면\n자동으로 분석이 시작돼요."
              : "상대방이 작성을 완료하면\n자동으로 분석이 시작돼요."}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-[#EBEBF0] rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#ffd1da" }}
            initial={{ width: "0%" }}
            animate={{ width: readyToGo ? "100%" : `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>

        {/* Step cards — same style as SoloLoading */}
        <div className="space-y-2.5 mb-8">
          {steps.map((step, i) => {
            const isActive = i === currentStep && !readyToGo;
            const isDone = (i < currentStep) || readyToGo;
            if (i > currentStep && !readyToGo) return null;
            return (
              <AnimatePresence key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#dddddd] text-left"
                  style={
                    isActive
                      ? { boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0" }
                      : undefined
                  }
                >
                  <span className="text-lg">{step.emoji}</span>
                  <span className="text-[13px] text-[#3f3f3f] flex-1">{step.text}</span>
                  {isDone ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[#5BB89A] text-sm"
                    >
                      ✓
                    </motion.span>
                  ) : isActive ? (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.div
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                        />
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>

        {/* Copy link — only for role A while waiting */}
        {role === "A" && !readyToGo && (
          <div
            className="mb-7 p-4 rounded-2xl bg-white border border-[#dddddd] text-left"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
          >
            <p className="text-[11.5px] text-[#929292] mb-2">링크를 아직 공유하지 않았다면:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#f7f7f7] rounded-lg px-3 py-2 text-[11px] text-[#636666] truncate border border-[#ebebeb]">
                {inviteLink}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-2 bg-[#ffd1da] text-[#222222] rounded-lg text-[12px] font-semibold hover:bg-[#ffb3c4] active:scale-[0.96] transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        )}

        {/* Partner status chips */}
        {!readyToGo && (
          <div className="flex gap-2 justify-center mb-6">
            {[
              { label: role === "A" ? "나" : "상대", done: role === "A" ? personADone : personBDone },
              { label: role === "A" ? "상대" : "나", done: role === "A" ? personBDone : personADone },
            ].map((p) => (
              <div
                key={p.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold border transition-all ${
                  p.done
                    ? "bg-[#fff5f7] border-[#ffd1da] text-[#c9485b]"
                    : "bg-white border-[#dddddd] text-[#929292]"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${p.done ? "bg-[#ffd1da]" : "bg-[#dddddd]"}`} />
                {p.label} {p.done ? "완료" : "대기 중"}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleDemoSkip}
          className="text-[11.5px] text-[#929292] hover:text-[#c9485b] transition-colors font-medium"
        >
          데모용: 예시 데이터로 바로 분석 →
        </button>
      </motion.div>
    </div>
  );
}
