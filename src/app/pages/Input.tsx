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
    <div className="flex-1 flex flex-col bg-[#F5F5F7] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-safe-top pb-4 flex items-center border-b border-[#EBEBF0] sticky top-0 z-50">
        <div className="h-14 flex items-center w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center text-[#636366] hover:text-[#1C1C1E] transition-colors bg-[#F5F5F7] hover:bg-[#EBEBF0] rounded-xl"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex-1 px-4">
            <h1 className="text-center text-[17px] font-bold text-[#1C1C1E] tracking-tight">
              갈등 서술하기
            </h1>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-7 pb-36 space-y-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-[22px] font-bold text-[#1C1C1E] leading-tight mb-2 tracking-tight">
            어떤 갈등이 있었는지<br />자유롭게 적어주세요
          </h2>
          <p className="text-[13.5px] text-[#636366] leading-relaxed">
            잘잘못을 가리지 않아요. 있었던 일과 느낀 감정을 솔직하게 써주세요.
          </p>
        </motion.div>

        {/* Relationship Type */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-[13.5px] font-bold text-[#1C1C1E] mb-2">
            관계 유형
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-white rounded-2xl px-5 py-4 text-left text-[15px] border border-[#EBEBF0] flex items-center justify-between hover:border-[#ffd1da] transition-colors"
              style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
            >
              <span className={relationshipType ? "text-[#1C1C1E]" : "text-[#AEAEB2]"}>
                {relationshipType === "기타"
                  ? (customRelationship || "기타 (직접 입력)")
                  : (relationshipType || "상대방과의 관계를 선택해주세요")}
              </span>
              <ChevronDown
                size={17}
                className={`text-[#AEAEB2] transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#EBEBF0] shadow-lg z-30 overflow-hidden"
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setRelationshipType(type);
                      if (type !== "기타") setCustomRelationship("");
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 text-[14px] transition-colors ${
                      relationshipType === type
                        ? "bg-[#fff5f7] text-[#c9485b] font-bold"
                        : "text-[#1C1C1E] hover:bg-[#fff5f7]"
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
                  className="w-full bg-white rounded-2xl px-5 py-4 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] border border-[#ffd1da] outline-none focus:ring-2 focus:ring-[#ffd1da]/50 transition-all"
                  style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px" }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Free text description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-[13.5px] font-bold text-[#1C1C1E] mb-2">
            갈등 내용
          </label>
          <div
            className="bg-white rounded-2xl border border-[#EBEBF0] transition-all focus-within:border-[#ffd1da] focus-within:ring-2 focus-within:ring-[#ffd1da]/40"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
          >
            <textarea
              className="w-full bg-transparent rounded-2xl p-5 text-[15px] text-[#1C1C1E] placeholder-[#AEAEB2] outline-none resize-none min-h-[240px] sm:min-h-[300px] leading-relaxed"
              placeholder={"무슨 일이 있었는지 자유롭게 적어주세요.\n\n예시: 어젯밤 10시에 연락이 안 됐는데, 3시간이나 답이 없어서 무시당하는 기분이 들었어. 자기 전에 한마디라도 해줬으면 좋겠어..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <p className="text-[12px] text-[#AEAEB2] mt-2 px-1">
            {description.length}자 입력 · 최소 10자 이상 작성해주세요
          </p>
        </motion.div>
      </div>

      {/* CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent z-50">
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`w-full py-4 rounded-2xl font-bold text-[15.5px] transition-all flex items-center justify-center gap-2 ${
            isComplete
              ? "bg-[#c9485b] hover:bg-[#b83050] active:scale-[0.98] text-white"
              : "bg-[#EBEBF0] text-[#AEAEB2] cursor-not-allowed"
          }`}
          style={isComplete ? { boxShadow: "rgba(201,72,91,0.28) 0 4px 16px 0" } : {}}
        >
          {isComplete ? (
            <>
              <Check strokeWidth={3} size={19} />
              작성 완료
            </>
          ) : (
            "관계 유형과 갈등 내용을 작성해주세요"
          )}
        </button>
      </div>
    </div>
  );
}
