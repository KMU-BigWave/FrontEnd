import { useNavigate } from "react-router";
import { ArrowLeft, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

export function InvitePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen">
      {/* Header */}
      <div className="px-5 py-4 flex items-center border-b border-slate-50 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-center pr-10 text-[17px] font-bold text-slate-800 tracking-tight">
          상대방 초대하기
        </h1>
      </div>

      <div className="flex-1 px-6 pt-10 pb-8 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-gradient-to-br from-violet-50 to-indigo-50 rounded-[32px] p-8 pb-10 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-violet-100/50 mb-8"
        >
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-white rounded-full text-[12px] font-bold text-violet-600 mb-4 shadow-sm border border-violet-100">PIN CODE</span>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">아래 코드를 공유해주세요</h2>
            <p className="text-[14px] text-slate-500 mt-2 font-medium">상대방이 코드를 입력하면 대화가 시작됩니다.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center mb-6">
            <div className="text-[44px] font-black tracking-[0.2em] text-violet-600 font-mono flex justify-center items-center h-16 relative">
              8421
              {/* Optional: scanning line effect */}
              <div className="absolute top-0 w-full h-1 bg-violet-300/30 blur-sm animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] transition-all shadow-sm ${
                copied
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={18} strokeWidth={2.5} className="text-emerald-500" /> 복사 완료
                </>
              ) : (
                <>
                  <Copy size={18} strokeWidth={2} className="text-slate-400" /> 코드 복사
                </>
              )}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-3.5 rounded-xl font-bold text-[14px] shadow-md hover:bg-slate-900 transition-all border border-transparent">
              <Share2 size={18} strokeWidth={2} /> 링크 공유
            </button>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="w-full mt-auto mb-6 flex flex-col items-center gap-3">
          <p className="text-[13px] text-slate-400 font-medium mb-1">상대방을 초대했다면 내 입장을 먼저 작성해주세요</p>
          
          <button
            onClick={() => navigate("/input")}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-[20px] font-bold text-[16px] shadow-[0_4px_20px_-4px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
          >
            내 입장 작성하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}