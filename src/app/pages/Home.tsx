import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, ChevronRight, Calendar, ChevronLeft, Link as LinkIcon, Users, Sparkles, ArrowRight, Brain, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HomePage() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    setShowTutorial(true);
  }, []);

  const TOTAL_STEPS = 5;
  const completeTutorial = () => setShowTutorial(false);
  const nextStep = () => {
    if (tutorialStep < TOTAL_STEPS - 1) setTutorialStep((prev) => prev + 1);
    else completeTutorial();
  };
  const prevStep = () => {
    if (tutorialStep > 0) setTutorialStep((prev) => prev - 1);
  };

  const tutorialContent = [
    {
      tag: "두 사람 모드",
      tagColor: "#ffd1da",
      textColor: "#c9485b",
      icon: <Users className="w-6 h-6 text-[#c9485b]" />,
      title: "두 사람 모드란?",
      desc: "갈등을 겪고 있는 두 사람이 각자의 이야기를\n입력하면 AI가 구조를 분석해드려요.",
    },
    {
      tag: "두 사람 모드",
      tagColor: "#ffd1da",
      textColor: "#c9485b",
      icon: <LinkIcon className="w-6 h-6 text-[#c9485b]" />,
      title: "1. 방 만들기 & 초대",
      desc: "대화방을 만들고 생성된 링크와 비밀번호를\n갈등 상대방에게 공유하여 초대하세요.",
    },
    {
      tag: "두 사람 모드",
      tagColor: "#ffd1da",
      textColor: "#c9485b",
      icon: <MessageSquare className="w-6 h-6 text-[#c9485b]" />,
      title: "2. 각자 작성 → AI 분석",
      desc: "두 사람이 각자 입장을 작성하면\nAI가 사실·해석·감정·요구로 구조화해요.",
    },
    {
      tag: "생각 정리 모드",
      tagColor: "#ffb3c4",
      textColor: "#b83050",
      icon: <Brain className="w-6 h-6 text-[#b83050]" />,
      title: "생각 정리 모드란?",
      desc: "혼자서 복잡한 감정이나 상황을 정리할 때\n사용해요. 초대 링크 없이 바로 시작해요.",
    },
    {
      tag: "생각 정리 모드",
      tagColor: "#ffb3c4",
      textColor: "#b83050",
      icon: <Sparkles className="w-6 h-6 text-[#b83050]" />,
      title: "AI가 생각을 정리해드려요",
      desc: "내 이야기를 자유롭게 쓰면 AI 요약·\n생각 정리 지점·조언을 제공해요.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-[340px] rounded-3xl p-7 relative flex flex-col items-center"
            >
              <button
                onClick={completeTutorial}
                className="absolute top-5 right-5 text-[13px] text-[#AEAEB2] hover:text-[#636366] transition-colors font-medium"
              >
                건너뛰기
              </button>

              {/* Progress Dots */}
              <div className="flex gap-1.5 mb-6 mt-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: idx === tutorialStep ? 20 : 6,
                      backgroundColor: idx === tutorialStep
                        ? tutorialContent[tutorialStep].tagColor
                        : "#E5E5EA",
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="w-full flex justify-center h-[196px] mb-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col items-center text-center w-full"
                  >
                    {/* Mode tag */}
                    <div
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-4"
                      style={{
                        backgroundColor: `${tutorialContent[tutorialStep].tagColor}30`,
                        color: tutorialContent[tutorialStep].textColor,
                      }}
                    >
                      {tutorialContent[tutorialStep].tag}
                    </div>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${tutorialContent[tutorialStep].tagColor}35` }}
                    >
                      {tutorialContent[tutorialStep].icon}
                    </div>
                    <p className="text-[17px] font-bold text-[#1C1C1E] mb-2.5 tracking-tight">
                      {tutorialContent[tutorialStep].title}
                    </p>
                    <p className="text-[13.5px] text-[#636366] leading-relaxed whitespace-pre-wrap">
                      {tutorialContent[tutorialStep].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="w-full flex gap-2.5 mt-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#F5F5F7] text-[#636366] rounded-xl hover:bg-[#EBEBF0] transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex-1 h-11 text-[#222222] rounded-xl font-semibold text-[15px] transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  style={{ backgroundColor: tutorialContent[tutorialStep].tagColor }}
                >
                  {tutorialStep === TOTAL_STEPS - 1 ? "시작하기" : "다음으로"}
                  {tutorialStep < TOTAL_STEPS - 1 && <ArrowRight size={15} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-[#EBEBF0] sticky top-0 z-10">
        <div className="px-5 h-14 flex items-center justify-between max-w-3xl mx-auto">
          <span className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">
            티격태격
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="h-8 px-3 bg-[#f7f7f7] hover:bg-[#ebebeb] rounded-lg text-[12.5px] text-[#636366] font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-[#c9485b]" />
              튜토리얼
            </button>
            <button
              onClick={() => navigate("/mypage")}
              className="w-8 h-8 bg-[#F5F5F7] hover:bg-[#EBEBF0] rounded-lg flex items-center justify-center text-[#636366] transition-colors"
            >
              <User size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="px-5 py-6 max-w-3xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-[12.5px] text-[#AEAEB2] mb-0.5 font-medium">환영합니다</p>
          <p className="text-[22px] font-bold text-[#1C1C1E] tracking-tight leading-tight">
            김민수
            <span className="text-[#AEAEB2] font-medium text-[18px]"> 님</span>
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 gap-3 mb-7">
          {/* 두 사람 모드 */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate("/new")}
            className="w-full bg-[#ffd1da] hover:bg-[#ffb3c4] active:scale-[0.99] rounded-2xl p-5 text-left transition-all group"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.06) 0 2px 8px 0" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center">
                <Users size={19} className="text-[#c9485b]" />
              </div>
              <div className="w-8 h-8 bg-white/40 group-hover:bg-white/60 rounded-xl flex items-center justify-center transition-colors">
                <Plus size={17} className="text-[#c9485b]" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[#c9485b]/70 text-[11.5px] font-medium mb-0.5">갈등 분석 · 두 사람</p>
            <p className="text-[#222222] text-[17px] font-bold tracking-tight">두 사람 모드</p>
            <p className="text-[#6a6a6a] text-[12px] mt-1">각자 입장을 작성하면 AI가 갈등 구조를 분석해요</p>
          </motion.button>

          {/* 생각 정리 모드 */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            onClick={() => navigate("/solo")}
            className="w-full bg-white hover:bg-[#fff8f9] active:scale-[0.99] rounded-2xl p-5 text-left transition-all group border border-[#EBEBF0] hover:border-[#ffd1da]"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#fff5f7] rounded-xl flex items-center justify-center">
                <User size={19} className="text-[#c9485b]" />
              </div>
              <div className="w-8 h-8 bg-[#F5F5F7] group-hover:bg-[#fff0f3] rounded-xl flex items-center justify-center transition-colors">
                <Plus size={17} className="text-[#c9485b]" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[#c9485b]/60 text-[11.5px] font-medium mb-0.5">생각 정리 · 혼자</p>
            <p className="text-[#222222] text-[17px] font-bold tracking-tight">생각 정리 모드</p>
            <p className="text-[#6a6a6a] text-[12px] mt-1">혼자서 복잡한 감정과 상황을 AI와 함께 정리해요</p>
          </motion.button>
        </div>

        {/* History button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => navigate("/history")}
          className="w-full bg-white rounded-2xl border border-[#EBEBF0] px-5 py-4 flex items-center justify-between hover:border-[#ffd1da]/70 active:scale-[0.99] transition-all"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.03) 0 2px 6px 0" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#fff5f7] rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={17} className="text-[#c9485b]" />
            </div>
            <div className="text-left">
              <p className="text-[14.5px] font-bold text-[#1C1C1E] leading-tight">지난 대화 기록</p>
              <p className="text-[12px] text-[#AEAEB2]">분석 결과를 다시 볼 수 있어요</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#C7C7CC] flex-shrink-0" />
        </motion.button>
      </div>
    </div>
  );
}