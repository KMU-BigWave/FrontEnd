import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-[#fff5f7] rounded-2xl flex items-center justify-center mx-auto mb-5">
        <span className="text-3xl">🔍</span>
      </div>
      <p className="text-[20px] font-bold text-[#1C1C1E] mb-2 tracking-tight">
        페이지를 찾을 수 없어요
      </p>
      <p className="text-[14px] text-[#AEAEB2] mb-6">
        요청하신 페이지가 존재하지 않습니다.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-[#ffd1da] hover:bg-[#ffb3c4] text-[#222222] rounded-full font-semibold text-[15px] transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
