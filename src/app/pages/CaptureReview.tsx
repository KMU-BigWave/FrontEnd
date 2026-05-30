import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Image, MessageCircle } from "lucide-react";
import { api, type RelationshipType } from "../utils/api";

type CaptureMessage = {
  order: number;
  speaker: "A" | "B";
  text: string;
  time: string | null;
};

type CaptureReviewData = {
  sessionId: string;
  personAName: string;
  personBName: string;
  aText: string;
  bText: string;
  imageCount: number;
  messageCount: number;
  messages: CaptureMessage[];
  nextPath: string;
};

type StoredRoomData = {
  createdBy?: string;
  pin?: string;
  relationship?: string;
  relationshipType?: RelationshipType;
};

function textPreview(text: string) {
  return text.trim() || "읽어온 문장이 없어요.";
}

export function CaptureReview() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isReuploading, setIsReuploading] = useState(false);

  const data = useMemo(() => {
    if (!roomId) return null;
    const stored = sessionStorage.getItem(`captureReview_${roomId}`);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as CaptureReviewData;
    } catch {
      return null;
    }
  }, [roomId]);

  const nextPath = data?.nextPath ?? (roomId ? `/waiting/${roomId}?role=A` : "/home");

  const handleReupload = async () => {
    if (!data || isReuploading) return;

    const stored = localStorage.getItem(`room_${data.sessionId}`);
    const roomData = stored ? JSON.parse(stored) as StoredRoomData : {};
    const roomPassword = roomData.pin;

    if (!roomPassword || roomPassword.length !== 4) {
      navigate("/new");
      return;
    }

    setIsReuploading(true);

    try {
      const relationshipType = roomData.relationshipType ?? "OTHER";
      const session = await api.createSession({
        relationshipType,
        mode: "DUAL",
        roomPassword,
      });

      localStorage.setItem(`room_${session.id}`, JSON.stringify({
        createdBy: roomData.createdBy ?? data.personAName,
        pin: roomPassword,
        personA: null,
        personB: null,
        status: "waiting",
        relationship: roomData.relationship ?? "",
        relationshipType,
      }));

      navigate(`/new?captureRoomId=${session.id}&capture=1`, { replace: true });
    } catch (error) {
      console.error("재업로드 세션 생성 실패", error);
      alert("이미지를 다시 올릴 준비에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsReuploading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-5">
        <motion.div
          className="max-w-[340px] w-full text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="w-16 h-16 rounded-3xl bg-white border border-[#EBEBF0] flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-7 h-7 text-[#c9485b]" strokeWidth={2.1} />
          </div>
          <p className="text-[18px] font-bold text-[#222222] mb-2 tracking-tight">
            읽어온 대화를 찾지 못했어요
          </p>
          <p className="text-[13px] text-[#6a6a6a] mb-8 leading-relaxed">
            이미 분석이 진행 중일 수 있어요.<br />다음 화면에서 상태를 확인해주세요.
          </p>
          <button
            type="button"
            onClick={() => navigate(nextPath)}
            className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] active:scale-[0.98] transition-all font-semibold"
          >
            계속하기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
        <div className="mx-auto max-w-[560px] px-5 h-14 flex items-center">
          <button
            type="button"
            onClick={() => navigate(nextPath)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="pt-7 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fff5f7] rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd1da]" />
              <span className="text-[11.5px] text-[#c9485b] font-semibold">대화 캡쳐 분석</span>
            </div>
            <p className="text-[20px] font-bold text-[#222222] mb-1.5 tracking-tight">
              캡쳐를 이렇게 읽었어요
            </p>
            <p className="text-[13.5px] text-[#636366] leading-relaxed">
              아래 내용으로 두 사람의 입장을 정리했어요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-4">
              <div className="w-9 h-9 rounded-2xl bg-[#fff5f7] flex items-center justify-center mb-3">
                <Image className="w-4.5 h-4.5 text-[#c9485b]" strokeWidth={2.2} />
              </div>
              <p className="text-[11.5px] text-[#929292] mb-0.5">읽은 이미지</p>
              <p className="text-[18px] font-bold text-[#222222]">{data.imageCount}장</p>
            </div>
            <div className="bg-white border border-[#EBEBF0] rounded-2xl p-4">
              <div className="w-9 h-9 rounded-2xl bg-[#fff5f7] flex items-center justify-center mb-3">
                <MessageCircle className="w-4.5 h-4.5 text-[#c9485b]" strokeWidth={2.2} />
              </div>
              <p className="text-[11.5px] text-[#929292] mb-0.5">읽은 말풍선</p>
              <p className="text-[18px] font-bold text-[#222222]">{data.messageCount}개</p>
            </div>
          </div>

          <section className="space-y-3 mb-5">
            <div className="bg-white border border-[#EBEBF0] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0F0F5] flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#222222]">{data.personAName}</p>
                  <p className="text-[11.5px] text-[#929292]">오른쪽 말풍선으로 읽은 내용</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#fff5f7] text-[#c9485b] text-[11px] font-semibold">
                  나
                </span>
              </div>
              <div className="px-4 py-4 bg-white">
                <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#3f3f3f]">
                  {textPreview(data.aText)}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#EBEBF0] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0F0F5] flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#222222]">{data.personBName}</p>
                  <p className="text-[11.5px] text-[#929292]">왼쪽 말풍선으로 읽은 내용</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F5F6FF] text-[#7b87ff] text-[11px] font-semibold">
                  상대
                </span>
              </div>
              <div className="px-4 py-4 bg-white">
                <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#3f3f3f]">
                  {textPreview(data.bText)}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#EBEBF0] rounded-2xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-[#F0F0F5]">
              <p className="text-[14px] font-bold text-[#222222]">시간순으로 읽은 대화</p>
              <p className="text-[11.5px] text-[#929292] mt-0.5">말풍선 순서대로 정리했어요</p>
            </div>
            <div className="px-4 py-4 max-h-[360px] overflow-y-auto space-y-2.5">
              {data.messages.map((message) => {
                const isMe = message.speaker === "A";
                return (
                  <div
                    key={`${message.order}-${message.speaker}-${message.text}`}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 border ${
                        isMe
                          ? "bg-[#fff5f7] border-[#ffd1da]/70"
                          : "bg-[#F5F6FF] border-[#DDE1FF]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10.5px] font-bold ${isMe ? "text-[#c9485b]" : "text-[#7b87ff]"}`}>
                          {isMe ? data.personAName : data.personBName}
                        </span>
                        {message.time && <span className="text-[10px] text-[#929292]">{message.time}</span>}
                      </div>
                      <p className="text-[12.5px] leading-relaxed text-[#333333] break-keep">
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="bg-[#fff5f7] border border-[#ffd1da]/60 rounded-2xl px-4 py-4 mb-5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#c9485b] mt-0.5 flex-shrink-0" strokeWidth={2.4} />
              <p className="text-[12.5px] leading-relaxed text-[#636366]">
                이 내용으로 분석 결과를 확인할게요.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F5F7]/95 backdrop-blur-sm border-t border-[#EBEBF0] px-5 py-4">
        <div className="mx-auto max-w-[560px] space-y-2">
          <button
            type="button"
            disabled={isReuploading}
            onClick={handleReupload}
            className="w-full h-11 bg-white border border-[#dddddd] text-[#636366] rounded-xl hover:border-[#ffd1da] hover:text-[#c9485b] active:scale-[0.98] disabled:bg-[#F0F0F5] disabled:text-[#C7C7CC] transition-all font-semibold text-[13.5px]"
          >
            {isReuploading ? "다시 여는 중..." : "이미지 다시 올리기"}
          </button>
          <button
            type="button"
            onClick={() => navigate(nextPath)}
            className="w-full h-12 bg-[#ffd1da] text-[#222222] rounded-xl hover:bg-[#ffb3c4] active:scale-[0.98] transition-all font-semibold"
          >
            분석 결과 확인하기
          </button>
        </div>
      </div>
    </div>
  );
}
