import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Users, User, Trash2, Calendar, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { api, type RelationshipType, type SessionMode, type LlmResult } from "../utils/api";

interface HistoryItem {
  id: string;
  date: string;
  mode: "two-person" | "solo";
  title: string;
  summary: string;
  status: string;
  relationshipType: RelationshipType;
  createdAt: string;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  COUPLE: "연인/부부",
  FRIEND: "친구",
  FAMILY: "가족",
  ROOMMATE: "룸메이트",
  TEAM: "직장/팀",
  OTHER: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  WAITING_INPUT: "입력 대기",
  READY: "분석 준비",
  ANALYZING: "분석 중",
  DONE: "분석 완료",
  FAILED: "분석 실패",
  BLOCKED: "입력 차단",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

function modeToUi(mode: SessionMode): HistoryItem["mode"] {
  return mode === "SINGLE" ? "solo" : "two-person";
}

export function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.getHistory(),
      api.getSelfLlmResults().catch(() => null),
    ])
      .then(([historyResult, selfLlm]) => {
        if (cancelled) return;

        const llmBySession = new Map<string, LlmResult>();
        if (selfLlm) {
          for (const r of selfLlm.results) {
            llmBySession.set(r.sessionId, r);
          }
        }

        setItems(historyResult.items.map((item) => {
          const mode = modeToUi(item.mode);
          const relationship = RELATIONSHIP_LABELS[item.relationshipType] ?? "관계";
          const status = STATUS_LABELS[item.status] ?? item.status;
          const llm = mode === "solo" ? llmBySession.get(item.sessionId) : undefined;

          const title = llm?.diagramKeywords.coreConflict[0]
            ?? (mode === "solo" ? "생각 정리 기록" : `${relationship} 갈등 분석`);
          const summary = llm?.resultText
            ? llm.resultText.slice(0, 60) + (llm.resultText.length > 60 ? "…" : "")
            : `${status} · ${relationship}`;

          return {
            id: item.sessionId,
            date: formatDate(item.createdAt),
            mode,
            status: item.status,
            relationshipType: item.relationshipType,
            createdAt: item.createdAt,
            title,
            summary,
          };
        }));
      })
      .catch((error: { message?: string }) => {
        if (!cancelled) setErrorMsg(error.message ?? "지난 대화 기록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // 서버 삭제 API 미지원: 화면 목록에서만 제거(새로고침 시 다시 표시됨)
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const handleOpen = (item: HistoryItem) => {
    if (item.mode === "two-person") {
      sessionStorage.setItem(
        "analysisData",
        JSON.stringify({
          mode: "two-person",
          sessionId: item.id,
        })
      );
      navigate(item.status === "DONE" ? "/analysis" : `/waiting/${item.id}`);
    } else {
      sessionStorage.setItem(
        "soloData",
        JSON.stringify({
          sessionId: item.id,
        })
      );
      navigate(item.status === "DONE" ? "/solo-analysis" : "/solo-loading");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#dddddd] sticky top-0 z-20">
        <div className="mx-auto max-w-[480px] px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#f7f7f7] transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
          <p className="text-[15px] font-bold text-[#222222] tracking-tight">지난 대화 기록</p>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-5 pb-12">
        {isLoading ? (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 text-[#c9485b] animate-spin mx-auto mb-4" />
            <p className="text-[14px] font-semibold text-[#636366]">지난 기록을 불러오는 중이에요</p>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-24">
            <AlertCircle className="w-9 h-9 text-[#c9485b] mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-[#222222] mb-1">기록을 불러올 수 없어요</p>
            <p className="text-[13px] text-[#929292]">{errorMsg}</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              📭
            </motion.div>
            <p className="text-[15px] font-semibold text-[#222222] mb-1">아직 분석 기록이 없어요</p>
            <p className="text-[13px] text-[#929292]">새로운 분석을 시작해보세요</p>
          </motion.div>
        ) : (
          <div className="pt-4 space-y-2">
            <p className="text-[12px] text-[#929292] font-medium mb-3">총 {items.length}개의 기록</p>
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: deletingId === item.id ? 0 : 1,
                    y: 0,
                    x: deletingId === item.id ? 60 : 0,
                  }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ delay: idx * 0.04, duration: 0.28 }}
                  className="bg-white rounded-2xl border border-[#dddddd] overflow-hidden cursor-pointer hover:border-[#ffd1da]/70 transition-all active:scale-[0.99]"
                  style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
                  onClick={() => handleOpen(item)}
                >
                  <div className="flex items-center gap-3 px-4 py-4">
                    {/* Mode icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#fff5f7]">
                      {item.mode === "two-person" ? (
                        <Users className="w-[18px] h-[18px] text-[#c9485b]" />
                      ) : (
                        <User className="w-[18px] h-[18px] text-[#c9485b]" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#222222] truncate leading-tight mb-0.5">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[#929292] truncate">{item.summary}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
                          <Calendar size={10} />
                          {item.date}
                        </div>
                        <span className="text-[10.5px] text-[#c9485b] font-medium">
                          {RELATIONSHIP_LABELS[item.relationshipType] ?? "관계"}
                        </span>
                        {item.mode === "solo" && (
                          <span className="px-1.5 py-0.5 bg-[#fff5f7] text-[#c9485b] rounded-md text-[10px] font-semibold">
                            생각정리
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-[#F5F5F7] text-[#636366] rounded-md text-[10px] font-semibold">
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-[13px] h-[13px] text-[#C7C7CC] hover:text-red-400 transition-colors" />
                      </button>
                      <ChevronRight size={15} className="text-[#C7C7CC]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
