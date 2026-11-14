import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type { AuthUser, CurrentUser } from '../types';

interface RegisterInput {
  fullName: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  termsAccepted: boolean;
  specialties: Array<string | number>;
  customSpecialty?: string;
  businessName?: string;
  description?: string;
  governorateId?: number;
  area?: string;
}

interface RegisterResult {
  user: AuthUser;
  devCode?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  initializing: boolean;
  login: (phone: string, password: string) => Promise<CurrentUser>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshUser = useCallback(async (): Promise<CurrentUser | null> => {
    try {
      const data = await api<{ user: CurrentUser }>('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api<{ user: CurrentUser }>('/auth/me');
        if (active) setUser(data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    await api<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    });
    const data = await api<{ user: CurrentUser }>('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await api<RegisterResult>('/auth/register', {
      method: 'POST',
      body: input,
    });
    return result;
  }, []);

  const verifyPhone = useCallback(async (phone: string, code: string) => {
    await api('/auth/verify-phone', { method: 'POST', body: { phone, code } });
    const data = await api<{ user: CurrentUser }>('/auth/me');
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, verifyPhone, logout, refreshUser, setUser }),
    [user, initializing, login, register, verifyPhone, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
