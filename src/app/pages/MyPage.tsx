import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, LogOut, Camera } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../utils/authContext";
import { api } from "../utils/api";

const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "none", label: "선택 안 함" },
];

// 백엔드 성별 enum (M/F/OTHER/UNSPECIFIED) ↔ 프론트 (male/female/none) 매핑
const GENDER_API_TO_FRONT: Record<string, string> = {
  M: "male",
  F: "female",
  OTHER: "none",
  UNSPECIFIED: "none",
};

const GENDER_FRONT_TO_API: Record<string, string> = {
  male: "M",
  female: "F",
  none: "UNSPECIFIED",
};

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const [gender, setGender] = useState<string>("none");
  const [age, setAge] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // user 데이터 로드되면 성별/나이 동기화
  useEffect(() => {
    if (user) {
      setGender(user.gender ? GENDER_API_TO_FRONT[user.gender] ?? "none" : "none");
      setAge(user.age != null ? String(user.age) : "");
    }
  }, [user]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updated = await api.updateMyProfile({
        gender: GENDER_FRONT_TO_API[gender] ?? "UNSPECIFIED",
        age: age ? Number(age) : null,
      });
      // 응답이 새 user면 전역 state 갱신
      if (updated && typeof updated === "object" && "id" in updated) {
        setUser(updated as typeof user);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("프로필 저장 실패", error);
      alert("프로필 저장에 실패했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.name ?? "게스트";
  const displayEmail = user?.email ?? "로그인 정보 없음";
  const photoInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-20">
        <div className="mx-auto max-w-[560px] px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#636366]" />
          </button>
          <span className="text-[15px] font-bold text-[#1C1C1E] tracking-tight">마이 페이지</span>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
            className="text-[13px] font-semibold text-[#c9485b] hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            {isEditing ? (isSaving ? "저장 중..." : "완료") : "편집"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-5 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Profile Avatar */}
          <div className="flex flex-col items-center pt-8 pb-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ffd1da] to-[#ffb3c4] flex items-center justify-center"
                style={{ boxShadow: "rgba(255,145,168,0.3) 0 4px 12px 0" }}>
                {user?.picture_url ? (
                  <img src={user.picture_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[#c9485b] text-[28px] font-bold">{photoInitial}</span>
                )}
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#E5E5EA] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F5F5F7] transition-colors">
                  <Camera size={13} className="text-[#636366]" />
                </button>
              )}
            </div>
            <p className="text-[19px] font-bold text-[#1C1C1E] tracking-tight">{displayName}</p>
            <p className="text-[13px] text-[#AEAEB2] mt-0.5">{displayEmail}</p>

            {/* Google badge */}
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-full shadow-sm">
              <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-[11.5px] font-semibold text-[#636366]">Google 계정으로 연결됨</span>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl border border-[#EBEBF0] mb-3 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F5F5F7]">
              <p className="text-[11.5px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">계정 정보</p>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#636366]">이름</span>
                <span className="text-[14px] font-semibold text-[#1C1C1E]">{displayName}</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#636366]">이메일</span>
                <span className="text-[13px] font-medium text-[#636366]">{displayEmail}</span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-[#EBEBF0] mb-3 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F5F5F7]">
              <p className="text-[11.5px] font-semibold text-[#AEAEB2] uppercase tracking-wider">개인 정보</p>
            </div>

            {/* Gender */}
            <div className="px-5 py-4 border-b border-[#F5F5F7]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] text-[#636366]">성별</span>
                {!isEditing && (
                  <span className="text-[14px] font-semibold text-[#1C1C1E]">
                    {GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? "-"}
                  </span>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                        gender === opt.value
                          ? "bg-[#ffd1da] text-[#222222] border-[#ffd1da]"
                          : "bg-[#F5F5F7] text-[#636366] border-[#E5E5EA] hover:border-[#ffd1da]/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Age */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#636366]">나이</span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={1}
                      max={120}
                      className="w-16 h-9 px-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-center text-[14px] font-semibold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#ffd1da]/30 focus:border-[#ffd1da] transition-all"
                    />
                    <span className="text-[13px] text-[#636366]">세</span>
                  </div>
                ) : (
                  <span className="text-[14px] font-semibold text-[#1C1C1E]">{age ? `${age}세` : "-"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-[#E5E5EA] rounded-2xl text-[14px] font-semibold text-[#FF3B30] hover:bg-[#FFF5F5] transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            로그아웃
          </button>
        </motion.div>
      </main>
    </div>
  );
}
