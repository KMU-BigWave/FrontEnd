import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

const RELATIONSHIP_TYPES = [
  "연인", "부부", "친구", "가족", "직장 동료", "룸메이트", "기타"
];

export function InputPage() {
  const navigate = useNavigate();
  const [relationshipType, setRelationshipType] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [description, setDescription] = useState("");

  const effectiveRelationship = relationshipType === "기타" ? customRelationship : relationshipType;
  const isComplete = effectiveRelationship.trim() !== "" && description.trim().length >= 10;

  const handleNext = () => {
    navigate("/waiting");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-4 flex items-center shadow-sm sticky top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors bg-slate-50 rounded-full border border-slate-100"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex-1 px-4">
          <h1 className="text-center text-[17px] font-bold text-slate-800 tracking-tight">
            갈등 서술하기
          </h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-2"
        >
          <h1 className="text-[24px] font-bold text-slate-900 leading-tight mb-2 tracking-tight">
            어떤 갈등이 있었는지<br/>자유롭게 적어주세요
          </h1>
          <p className="text-[14px] font-medium text-slate-500">
            잘잘못을 가리지 않아요. 있었던 일과 느낀 감정을 솔직하게 써주세요.
          </p>
        </motion.div>

        {/* Relationship Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-[14px] font-bold text-slate-700 mb-2">관계 유형</label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-white rounded-2xl px-5 py-4 text-left text-[15px] text-slate-800 border border-slate-200 shadow-sm flex items-center justify-between hover:border-violet-200 transition-colors"
            >
              <span className={relationshipType ? "text-slate-800" : "text-slate-400"}>
                {relationshipType === "기타" ? (customRelationship || "기타 (직접 입력)") : (relationshipType || "상대방과의 관계를 선택해주세요")}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-lg z-30 overflow-hidden"
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setRelationshipType(type); if (type !== "기타") setCustomRelationship(""); setShowDropdown(false); }}
                    className={`w-full text-left px-5 py-3.5 text-[14px] hover:bg-violet-50 transition-colors ${
                      relationshipType === type ? "bg-violet-50 text-violet-700 font-bold" : "text-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </motion.div>
            )}
            {/* Custom relationship input */}
            {relationshipType === "기타" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3"
              >
                <input
                  type="text"
                  value={customRelationship}
                  onChange={(e) => setCustomRelationship(e.target.value)}
                  placeholder="관계를 직접 입력해주세요 (예: 선후배, 사제 등)"
                  className="w-full bg-white rounded-2xl px-5 py-4 text-[15px] text-slate-800 placeholder-slate-400 border border-violet-200 shadow-sm outline-none focus:ring-2 focus:ring-violet-200 transition-all"
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Free text description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-[14px] font-bold text-slate-700 mb-2">갈등 내용</label>
          <div className="bg-white rounded-[24px] p-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-200">
            <textarea
              className="w-full bg-transparent rounded-[20px] p-5 text-[15px] text-slate-800 placeholder-slate-400 outline-none resize-none min-h-[240px] sm:min-h-[300px]"
              placeholder={"무슨 일이 있었는지 자유롭게 적어주세요.\n\n예시: 어젯밤 10시에 연락이 안 됐는데, 3시간이나 답이 없어서 무시당하는 기분이 들었어. 자기 전에 한마디라도 해줬으면 좋겠어..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <p className="text-[12px] text-slate-400 mt-2 px-1">
            {description.length}자 입력 · 최소 10자 이상 작성해주세요
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-50">
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`w-full py-4.5 rounded-[20px] font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-lg ${
            isComplete
              ? "bg-violet-500 hover:bg-violet-600 text-white shadow-violet-200/50 border-none"
              : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
          }`}
        >
          {isComplete ? (
            <>
              <Check strokeWidth={3} size={20} /> 작성 완료
            </>
          ) : "관계 유형과 갈등 내용을 작성해주세요"}
        </button>
      </div>
    </div>
  );
}