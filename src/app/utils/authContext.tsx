import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE_URL, api, type Me } from './api';

export type User = Me;

interface AuthContextType {
  user: Me | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  setUser: (user: Me | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  setUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((me) => {
        setUser(me);
        const pendingInvite = localStorage.getItem("pendingInvite");
        if (pendingInvite) {
          localStorage.removeItem("pendingInvite");
          window.location.replace(pendingInvite);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  const logout = () => {
    void api.logout().catch((error) => {
      console.error("로그아웃 실패", error);
    });
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
