import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../utils/authContext';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FFFBFC]">
      <header className="sticky top-0 z-20 bg-[#FFFBFC]/80 backdrop-blur-lg">
        <div className="mx-auto max-w-[480px] px-5 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-[18px] h-[18px] text-gray-500" />
          </button>
          <p className="text-sm text-gray-800">마이페이지</p>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-5 pb-12">
        {/* Profile card */}
        <motion.div
          className="mt-4 rounded-[20px] bg-white border border-gray-100 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#FF8FA8] flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,138,0.2)]">
              <span className="text-white text-lg">{user.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-gray-800 mb-0.5">{user.name}</p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0F3]">
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[10px] text-[#E85577]">Google 연동</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAFAFA]">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">이름</p>
                <p className="text-sm text-gray-700">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAFAFA]">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">이메일</p>
                <p className="text-sm text-gray-700">{user.email}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info note */}
        <motion.div
          className="mt-4 rounded-[16px] bg-gradient-to-r from-[#FFF8FA] to-[#F8F0FF] border border-pink-50 p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">💡</span>
            <p className="text-xs text-gray-400 leading-relaxed">
              현재 구글 로그인 정보로 계정이 연동되어 있어요.
              분석 기록은 이 기기에 저장되며, 서버 연동 시 동기화될 예정이에요.
            </p>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </motion.div>

        {/* App info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-300">티격태격 v0.1.0</p>
          <p className="text-[10px] text-gray-300 mt-0.5">캡스톤 프로젝트 · AI 갈등 구조 시각화</p>
        </div>
      </main>
    </div>
  );
}