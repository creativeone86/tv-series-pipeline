'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { getStoredUser, storeUser, clearUser, setToken, clearToken } from '@/lib/auth';
import { applyLocaleIfUnset } from '@/hooks/use-locale';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string;
  locale: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      applyLocaleIfUnset(stored.locale);
      // Verify token is still valid
      api.me()
        .then((data: any) => {
          setUser(data);
          storeUser(data);
          applyLocaleIfUnset(data?.locale);
        })
        .catch(() => {
          clearToken();
          clearUser();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data: any = await api.login({ email, password });
    setToken(data.token);
    storeUser(data.user);
    setUser(data.user);
    applyLocaleIfUnset(data.user?.locale);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data: any = await api.register({ email, password, name });
    setToken(data.token);
    storeUser(data.user);
    setUser(data.user);
    applyLocaleIfUnset(data.user?.locale);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearUser();
    setUser(null);
    // v10.4.3: httpOnly cookie can only be cleared by the server (not visible to scripts) — fire-and-forget; failure must not block logout
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
