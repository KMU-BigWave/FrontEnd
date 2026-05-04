import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Users, User, Trash2, Calendar, ChevronRight } from "lucide-react";

interface HistoryItem {
  id: string;
  date: string;
  mode: "two-person" | "solo";
  title: string;
  summary: string;
  personA?: string;
  personB?: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    date: "2026.03.15",
    mode: "two-person",
    title: "약속 시간 지각 갈등",
    summary: "약속 시간에 30분 늦은 것을 둘러싼 해석의 차이",
    personA: "민수",
    personB: "지영",
  },
  {
    id: "h2",
    date: "2026.03.10",
    mode: "two-person",
    title: "가사 분담 갈등",
    summary: "가사 분담 비율에 대한 인식 차이",
    personA: "나",
    personB: "파트너",
  },
  {
    id: "h3",
    date: "2026.03.03",
    mode: "solo",
    title: "직장에서의 스트레스 정리",
    summary: "팀장과의 소통 방식에 대한 내 감정 분석",
  },
  {
    id: "h4",
    date: "2026.02.22",
    mode: "two-person",
    title: "업무 커뮤니케이션 갈등",
    summary: "답장 속도에 대한 기대치 차이",
    personA: "사용자 A",
    personB: "사용자 B",
  },
];

export function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cm_history");
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      setItems(MOCK_HISTORY);
      localStorage.setItem("cm_history", JSON.stringify(MOCK_HISTORY));
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
      localStorage.setItem("cm_history", JSON.stringify(updated));
      setDeletingId(null);
    }, 300);
  };

  const handleOpen = (item: HistoryItem) => {
    if (item.mode === "two-person") {
      sessionStorage.setItem(
        "analysisData",
        JSON.stringify({
          mode: "two-person",
          personA: {
            name: item.personA || "사용자 A",
            text: "어제 약속 시간에 30분 늦게 도착했다. 미리 연락도 없었다. 나를 중요하게 생각하지 않는 것 같아서 화가 났다.",
          },
          personB: {
            name: item.personB || "사용자 B",
            text: "회의가 예상보다 길어져서 약속에 늦었다. 상대가 내 상황을 이해하지 못하는 것 같아서 답답했다.",
          },
        })
      );
      navigate("/analysis");
    } else {
      navigate("/solo-analysis");
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
        {items.length === 0 ? (
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
                        {item.mode === "two-person" && item.personA && item.personB && (
                          <span className="text-[10.5px] text-[#c9485b] font-medium">
                            {item.personA} ↔ {item.personB}
                          </span>
                        )}
                        {item.mode === "solo" && (
                          <span className="px-1.5 py-0.5 bg-[#fff5f7] text-[#c9485b] rounded-md text-[10px] font-semibold">
                            생각정리
                          </span>
                        )}
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
