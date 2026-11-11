/**
 * Auth Context
 * ------------
 * Session state, login/register/logout, and role helpers.
 * Combines TimeTrack's enterprise session management with Base44's auth helpers.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  authApi,
  registerSessionHandler,
  suppressUnauthenticatedErrors,
  type CurrentUser,
  type SessionErrorCode,
} from '../services/api';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionError: { code: SessionErrorCode; message: string } | null;
  clearSessionError: () => void;
  login: (email: string, password: string) => Promise<CurrentUser>;
  register: (data: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  navigateToLogin: (returnTo?: string) => void;
  isMaster: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCustomer: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<{
    code: SessionErrorCode;
    message: string;
  } | null>(null);

  const hadSessionRef = useRef(false);
  const loggingOutRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.session();
      if (res.authenticated && res.user) {
        hadSessionRef.current = true;
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    registerSessionHandler((code, message) => {
      if (code === 'UNAUTHENTICATED' && !hadSessionRef.current) return;
      if (code === 'UNAUTHENTICATED' && loggingOutRef.current) return;
      setSessionError({ code, message });
      hadSessionRef.current = false;
      setUser(null);
    });
    return () => registerSessionHandler(null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    hadSessionRef.current = true;
    setSessionError(null);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; fullName?: string; phone?: string }) => {
      const res = await authApi.register(data);
      hadSessionRef.current = true;
      setSessionError(null);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    loggingOutRef.current = true;
    const restore = suppressUnauthenticatedErrors();
    try {
      await authApi.logout();
    } catch {
      // non-fatal
    } finally {
      hadSessionRef.current = false;
      setSessionError(null);
      setUser(null);
      restore();
      setTimeout(() => {
        loggingOutRef.current = false;
      }, 1500);
    }
  }, []);

  const navigateToLogin = useCallback((returnTo?: string) => {
    const target = returnTo || window.location.pathname + window.location.search;
    const suffix = target && target !== '/' ? `?returnTo=${encodeURIComponent(target)}` : '';
    window.location.href = `/login${suffix}`;
  }, []);

  const clearSessionError = useCallback(() => setSessionError(null), []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    sessionError,
    clearSessionError,
    login,
    register,
    logout,
    refresh,
    navigateToLogin,
    isMaster: user?.role === 'master',
    isAdmin: user?.role === 'admin' || user?.role === 'master',
    isManager: user?.role === 'manager',
    isCustomer: user?.role === 'customer',
    isEmployee: user?.role === 'employee',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
