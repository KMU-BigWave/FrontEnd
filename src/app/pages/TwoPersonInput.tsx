import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Copy, Check, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { api, type RelationshipType } from "../utils/api";

const MAX_CHARS = 30000;
const RELATIONSHIP_TYPES = ["연인", "부부", "친구", "가족", "직장 동료", "룸메이트", "기타"];
const DANGER_KEYWORDS = ["자해", "자살", "죽고 싶", "죽고싶", "폭행", "폭력", "살인", "죽이고", "때리", "죽여", "자살하", "자해하", "칼로 찌", "스스로 목숨"];
function hasDanger(text: string) { return DANGER_KEYWORDS.some((kw) => text.includes(kw)); }

const RELATIONSHIP_TYPE_MAP: Record<string, RelationshipType> = {
  연인: "COUPLE",
  부부: "COUPLE",
  친구: "FRIEND",
  가족: "FAMILY",
  "직장 동료": "TEAM",
  룸메이트: "ROOMMATE",
  기타: "OTHER",
};

export function TwoPersonInput() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"create" | "write">("create");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [relationship, setRelationship] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteLink = roomId ? `${window.location.origin}/invite/${roomId}` : "";

  const handleCreateRoom = async () => {
    if (!nickname.trim() || pin.length !== 4 || isCreating) return;
    const relationshipType = RELATIONSHIP_TYPE_MAP[relationship] ?? "OTHER";
    setIsCreating(true);
    try {
      const session = await api.createSession({ relationshipType, mode: "DUAL", roomPassword: pin });
      const id = session.id;
      localStorage.setItem(`room_${id}`, JSON.stringify({
        createdBy: nickname.trim(),
        pin,
        personA: null,
        personB: null,
        status: "waiting",
        relationship: relationship === "기타" ? customRelationship.trim() : relationship,
        relationshipType,
      }));
      setRoomId(id);
      setStep("write");
    } catch (error) {
      console.error("세션 생성 실패", error);
      alert("세션 생성에 실패했어요. 백엔드 서버 실행과 로그인 상태를 확인해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(inviteLink); }
    catch {
      const ta = document.createElement("textarea"); ta.value = inviteLink;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !roomId || isSubmitting) return;
    if (hasDanger(text)) { navigate("/safety"); return; }
    setIsSubmitting(true);

    try {
      await api.submitInput(roomId, text.trim());
    } catch (error) {
      console.error("입력 저장 실패", error);
      alert("입력 저장에 실패했어요.");
      setIsSubmitting(false);
      return;
    }

    const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
    roomData.personA = { name: nickname.trim(), text: text.trim() };
    if (roomData.personB) {
      roomData.status = "ready";
      localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
      sessionStorage.setItem("analysisData", JSON.stringify({ mode: "two-person", personA: roomData.personA, personB: roomData.personB }));
      navigate("/analysis");
    } else {
      roomData.status = "waiting-b";
      localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
      navigate(`/waiting/${roomId}`);
    }
    setIsSubmitting(false);
  };

  /* ── Step: Create Room ── */
  if (step === "create") {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
          <div className="mx-auto max-w-[480px] px-5 h-14 flex items-center">
            <button onClick={() => navigate("/home")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors">
              <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[480px] px-5 pb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="pt-7 pb-8">
              <div className="text-2xl mb-3">👫</div>
              <p className="text-[20px] font-bold text-[#222222] mb-1.5 tracking-tight">두 사람 모드</p>
              <p className="text-[13.5px] text-[#636366] leading-relaxed">
                초대 링크를 만들어 상대에게 보내세요.<br />각자 입장을 작성하면 AI가 구조를 분석해요.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-semibold text-[#222222] mb-2">나의 이름 (별명)</label>
                <input type="text"
                  className="w-full h-12 px-4 bg-white border border-[#dddddd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] transition-all text-[#222222] placeholder:text-[#929292]"
                  placeholder="예: 민수" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
              </div>
              <div>
                <label className="block text-[13.5px] font-semibold text-[#222222] mb-1">비밀번호 (숫자 4자리)</label>
                <p className="text-[12px] text-[#929292] mb-2">상대방이 초대 링크에 접속할 때 입력해야 해요</p>
                <input type="text" inputMode="numeric"
                  className="w-full h-12 px-4 bg-white border border-[#dddddd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] tracking-[0.5em] text-center transition-all text-[#222222] placeholder:text-[#929292]"
                  placeholder="• • • •" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} />
              </div>
              <button disabled={!nickname.trim() || pin.length !== 4 || isCreating} onClick={handleCreateRoom}
                className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] active:scale-[0.98] transition-all font-semibold">
                {isCreating ? "생성 중..." : "초대 링크 만들기"}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ── Step: Write ── */
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
        <div className="mx-auto max-w-[560px] px-5 h-14 flex items-center">
          <button onClick={() => setStep("create")} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors">
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-5 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Invite link card */}
          <div className="my-6 p-4 rounded-2xl bg-white border border-[#EBEBF0]">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-3.5 h-3.5 text-[#c9485b]" />
              <p className="text-[12px] font-semibold text-[#c9485b]">초대 링크</p>
            </div>
            <p className="text-[12px] text-[#636366] mb-3 leading-relaxed">
              이 링크와 비밀번호{" "}
              <span className="font-bold text-[#c9485b] px-1.5 py-0.5 bg-[#fff5f7] rounded-md mx-0.5">{pin}</span>
              을 상대에게 보내주세요
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#F5F5F7] rounded-xl px-3 py-2 text-[11.5px] text-[#636366] truncate border border-[#EBEBF0]">{inviteLink}</div>
              <button onClick={handleCopy}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-[#ffd1da] text-[#222222] rounded-xl text-[12px] font-semibold hover:bg-[#ffb3c4] active:scale-[0.96] transition-all flex-shrink-0 min-w-[68px]">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[17px] font-bold text-[#222222] mb-1 tracking-tight">{nickname}님의 이야기</p>
            <p className="text-[12.5px] text-[#929292]">어떤 상황이었는지, 자유롭게 적어주세요</p>
          </div>

          {/* Relationship Type */}
          <div className="mb-4">
            <label className="block text-[13.5px] font-semibold text-[#222222] mb-2">관계 유형</label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_TYPES.map((type) => (
                <button key={type} onClick={() => setRelationship(type)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all ${relationship === type ? "bg-[#ffd1da] text-[#222222] border-[#ffd1da]" : "bg-white text-[#636366] border-[#dddddd] hover:border-[#ffd1da]"}`}>
                  {type}
                </button>
              ))}
            </div>
            {relationship === "기타" && (
              <input type="text" autoFocus
                className="mt-2.5 w-full h-10 px-4 bg-white border border-[#dddddd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] transition-all text-[#222222] placeholder:text-[#929292] text-[13.5px]"
                placeholder="관계를 직접 입력해주세요 (예: 고등학교 친구)"
                value={customRelationship} onChange={(e) => setCustomRelationship(e.target.value)} maxLength={30} />
            )}
          </div>

          {/* Tips */}
          <div className="bg-[#fff5f7] rounded-2xl p-4 mb-4 border border-[#ffd1da]/50">
            <p className="text-[12px] font-semibold text-[#c9485b] mb-2">💡 이렇게 적으면 더 정확해요</p>
            <div className="space-y-1">
              {["실제로 있었던 일 (사실)", "그 상황을 어떻게 받아들였는지 (해석)", "그때 어떤 기분이었는지 (감정)", "무엇을 원하는지, 바라는 것 (요구)"].map((tip) => (
                <p key={tip} className="text-[12px] text-[#636366] flex items-start gap-1.5">
                  <span className="text-[#c9485b] mt-0.5">·</span>{tip}
                </p>
              ))}
            </div>
          </div>

          <div className="relative mb-4">
            <textarea
              className="w-full min-h-[300px] px-4 py-4 bg-white border border-[#dddddd] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/40 focus:border-[#ffd1da] resize-none transition-all text-[#222222] placeholder:text-[#929292] text-[14px] leading-relaxed"
              placeholder={`자유롭게 작성해주세요.\n\n• 있었던 사실 — 실제로 어떤 일이 있었나요?\n• 나의 해석 — 그 상황을 어떻게 받아들였나요?\n• 느꼈던 감정 — 그때 어떤 감정이 들었나요?\n• 바라는 것 — 상대방이나 상황에서 무엇을 원하나요?`}
              value={text} onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }} />
            <div className="absolute bottom-3 right-4 text-[10.5px] text-[#929292]">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </div>
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
