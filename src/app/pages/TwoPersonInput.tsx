import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Copy, Check, Link as LinkIcon, ArrowLeft, ImagePlus, UploadCloud, X } from "lucide-react";
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
  const [searchParams] = useSearchParams();
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
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureImages, setCaptureImages] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [isCaptureSubmitting, setIsCaptureSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState("");

  const inviteLink = roomId ? `${window.location.origin}/invite/${roomId}?from=${encodeURIComponent(nickname.trim())}` : "";
  const relationshipReady = Boolean(relationship && (relationship !== "기타" || customRelationship.trim()));

  useEffect(() => {
    const captureRoomId = searchParams.get("captureRoomId");
    if (!captureRoomId) return;

    const stored = localStorage.getItem(`room_${captureRoomId}`);
    if (!stored) return;

    try {
      const roomData = JSON.parse(stored);
      const savedRelationship = roomData.relationship ?? "";

      setRoomId(captureRoomId);
      setNickname(roomData.createdBy ?? "");
      setPin(roomData.pin ?? "");
      setStep("write");
      setText("");
      setCaptureImages([]);
      setCaptureError("");
      setIsCaptureOpen(true);

      if (RELATIONSHIP_TYPES.includes(savedRelationship)) {
        setRelationship(savedRelationship);
      } else if (savedRelationship) {
        setRelationship("기타");
        setCustomRelationship(savedRelationship);
      }
    } catch {
      // 저장된 방 정보가 깨졌으면 기본 입력 화면을 유지합니다.
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      captureImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [captureImages]);

  const handleCreateRoom = async () => {
    if (!nickname.trim() || pin.length !== 4 || !relationshipReady || isCreating) return;
    const relationshipType = RELATIONSHIP_TYPE_MAP[relationship] ?? "OTHER";
    setIsCreating(true);
    try {
      const session = await api.createSession({ relationshipType, mode: "DUAL", roomPassword: pin, nickname: nickname.trim() });
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
      const apiError = error as { code?: string; message?: string };
      // 백엔드 모더레이션이 위험 콘텐츠로 차단한 경우
      if (apiError.code === "INPUT_BLOCKED") {
        navigate("/safety");
        return;
      }
      console.error("입력 저장 실패", error);
      alert(apiError.message ?? "입력 저장에 실패했어요.");
      setIsSubmitting(false);
      return;
    }

    const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
    roomData.personA = { name: nickname.trim(), text: text.trim() };
    roomData.status = "waiting-b";
    localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
    // sessionId + personA 이름 저장 (대시보드 표시용)
    sessionStorage.setItem("analysisData", JSON.stringify({
      mode: "two-person",
      sessionId: roomId,
      personA: { name: nickname.trim() },
    }));
    navigate(`/waiting/${roomId}?role=A`);
    setIsSubmitting(false);
  };

  const handleCaptureFiles = (fileList: FileList | File[] | null | undefined) => {
    const files = Array.from(fileList ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6);

    if (!files.length) return;

    captureImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setCaptureError("");
    setCaptureImages(files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    })));
  };

  const handleSubmitCapture = async () => {
    if (!roomId || !captureImages.length || isCaptureSubmitting) return;

    setIsCaptureSubmitting(true);
    setCaptureError("");

    try {
      const result = await api.submitKakaoCaptures(roomId, captureImages.map((image) => image.file));
      const aInput = result.inputs.find((input) => input.speaker === "A");
      const bInput = result.inputs.find((input) => input.speaker === "B");
      const roomData = JSON.parse(localStorage.getItem(`room_${roomId}`) || "{}");
      const personAName = nickname.trim();
      const personBName = roomData.personB?.name ?? "상대";
      const nextPath = `/waiting/${roomId}?role=A`;

      localStorage.setItem(`room_${roomId}`, JSON.stringify({
        ...roomData,
        personA: { name: personAName, text: aInput?.raw_text ?? "" },
        personB: { name: personBName, text: bInput?.raw_text ?? "" },
        status: result.feinAnalysisStatus === "DONE" ? "analyzing" : "waiting",
        captureParsing: result.captureParsing,
      }));

      sessionStorage.setItem("analysisData", JSON.stringify({
        mode: "two-person",
        sessionId: roomId,
        personA: { name: personAName },
        personB: { name: personBName },
        myRole: "A",
      }));

      sessionStorage.setItem(`captureReview_${roomId}`, JSON.stringify({
        sessionId: roomId,
        personAName,
        personBName,
        aText: aInput?.raw_text ?? "",
        bText: bInput?.raw_text ?? "",
        imageCount: result.captureParsing.imageCount,
        messageCount: result.captureParsing.summary.messageCount,
        messages: result.captureParsing.messages,
        nextPath,
      }));

      navigate(`/capture-review/${roomId}`);
    } catch (error) {
      const apiError = error as { code?: string; message?: string };

      if (apiError.code === "INPUT_BLOCKED") {
        navigate("/safety");
        return;
      }

      const messageByCode: Record<string, string> = {
        KAKAO_CAPTURE_EMPTY: "캡쳐에서 대화 말풍선을 찾지 못했어요. 대화 영역이 잘 보이는 이미지를 올려주세요.",
        KAKAO_CAPTURE_SPEAKER_INCOMPLETE: "양쪽 대화가 모두 보이는 캡쳐가 필요해요. 오른쪽/왼쪽 말풍선이 함께 보이는 이미지를 올려주세요.",
        TOO_MANY_IMAGES: "이미지는 최대 6장까지 올릴 수 있어요.",
        KAKAO_CAPTURE_IMAGE_REQUIRED: "분석할 이미지를 먼저 선택해주세요.",
        INPUT_ALREADY_SUBMITTED: "이미 이 방에 입력이 저장되어 있어요.",
      };

      setCaptureError(
        (apiError.code && messageByCode[apiError.code]) ||
        apiError.message ||
        "캡쳐 이미지를 분석하지 못했어요. 다시 시도해주세요.",
      );
    } finally {
      setIsCaptureSubmitting(false);
    }
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
              <div>
                <label className="block text-[13.5px] font-semibold text-[#222222] mb-2">관계 유형</label>
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRelationship(type)}
                      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all ${relationship === type ? "bg-[#ffd1da] text-[#222222] border-[#ffd1da]" : "bg-white text-[#636366] border-[#dddddd] hover:border-[#ffd1da]"}`}
                    >
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
              <button disabled={!nickname.trim() || pin.length !== 4 || !relationshipReady || isCreating} onClick={handleCreateRoom}
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

          {/* Tips */}
          <button
            type="button"
            onClick={() => setIsCaptureOpen(true)}
            className="w-full mb-4 p-4 bg-[#fff5f7] border-2 border-[#ffd1da] rounded-2xl flex items-center gap-3 text-left shadow-[0_6px_16px_rgba(201,72,91,0.08)] hover:bg-[#ffeaf0] hover:border-[#ffb3c4] active:scale-[0.99] transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#ffd1da] flex items-center justify-center flex-shrink-0 shadow-sm">
              <ImagePlus className="w-5 h-5 text-[#c9485b]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#222222] tracking-tight">대화 캡쳐로 분석하기</p>
              <p className="text-[12px] text-[#c9485b] mt-0.5 truncate font-medium">
                {captureImages.length
                  ? `${captureImages.length}장 선택됨`
                  : "카톡 캡쳐 이미지를 선택할 수 있어요"}
              </p>
            </div>
            {captureImages.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-white text-[#c9485b] text-[11px] font-semibold border border-[#ffd1da]">
                선택됨
              </span>
            )}
            {captureImages.length === 0 && (
              <span className="px-2.5 py-1 rounded-full bg-white text-[#c9485b] text-[11px] font-semibold border border-[#ffd1da]">
                이미지
              </span>
            )}
          </button>

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

      {isCaptureOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end justify-center px-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[560px] bg-white rounded-[24px] border border-[#EBEBF0] shadow-2xl overflow-hidden"
          >
            <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[17px] font-bold text-[#222222] tracking-tight">대화 캡쳐 업로드</p>
                <p className="text-[12.5px] text-[#929292] mt-1">카톡 캡쳐 이미지를 선택해주세요</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCaptureOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#636366] hover:bg-[#EBEBF0] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.4} />
              </button>
            </div>

            <div className="px-5 pb-5">
              {captureImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto">
                    {captureImages.map((image, index) => (
                      <div key={image.previewUrl} className="relative rounded-2xl overflow-hidden border border-[#EBEBF0] bg-[#F5F5F7]">
                        <img
                          src={image.previewUrl}
                          alt={`선택한 대화 캡쳐 ${index + 1}`}
                          className="w-full h-40 object-contain"
                        />
                        <div className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-semibold">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  {captureError && (
                    <p className="text-[12px] text-[#c9485b] leading-relaxed bg-[#fff5f7] border border-[#ffd1da]/60 rounded-xl px-3 py-2">
                      {captureError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 h-11 rounded-xl border border-[#dddddd] bg-white text-[#636366] text-[13px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all">
                      다시 선택
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleCaptureFiles(e.target.files)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isCaptureSubmitting}
                      onClick={handleSubmitCapture}
                      className="flex-1 h-11 rounded-xl bg-[#ffd1da] text-[#222222] text-[13px] font-semibold active:scale-[0.98] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] transition-all"
                    >
                      {isCaptureSubmitting ? "분석 중..." : "이미지로 분석 시작"}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="min-h-[220px] rounded-2xl border border-dashed border-[#ffd1da] bg-[#fff9fb] flex flex-col items-center justify-center px-6 text-center active:scale-[0.99] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-sm">
                    <UploadCloud className="w-6 h-6 text-[#c9485b]" strokeWidth={2.2} />
                  </div>
                  <p className="text-[14px] font-bold text-[#222222] mb-1">이미지 선택</p>
                  <p className="text-[12px] text-[#929292] leading-relaxed">앨범에서 카톡 캡쳐를 골라주세요</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleCaptureFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {isCaptureSubmitting && (
        <div className="fixed inset-0 z-[60] bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
          <motion.div
            className="max-w-[340px] w-full text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-[#EBEBF0]"
              animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.03, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <UploadCloud className="w-9 h-9 text-[#c9485b]" strokeWidth={2.1} />
            </motion.div>

            <p className="text-[20px] font-bold text-[#222222] mb-2 tracking-tight">
              이미지를 분석 중이에요
            </p>
            <p className="text-[13.5px] text-[#6a6a6a] mb-8 font-normal leading-relaxed">
              캡쳐 속 대화를 읽고 있어요.<br />잠시만 기다려 주세요.
            </p>

            <div className="space-y-3 text-left">
              {["캡쳐 이미지 확인 중...", "대화 말풍선 추출 중...", "두 사람의 입장 정리 중..."].map((label, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.12 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#EBEBF0]"
                >
                  <span className="text-[13px] font-semibold text-[#636366] flex-1">{label}</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
