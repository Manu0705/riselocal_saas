'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuth as clearStoredAuth,
  getTenantSlug as getStoredTenantSlug,
  getToken as getStoredToken,
  getUserName as getStoredUserName,
  setTenantSlug as storeTenantSlug,
  setUserName as storeUserName,
} from '@/lib/auth';

type AuthContextValue = {
  token: string | null;
  tenantSlug: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (token: string, tenantSlug?: string, userName?: string) => void;
  logout: () => void;
  setTenant: (slug: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Load stored auth only on the client after hydration.
    setToken(getStoredToken());
    setTenantSlug(getStoredTenantSlug());
    setUserName(getStoredUserName());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated) return;
    if (tenantSlug) {
      storeTenantSlug(tenantSlug);
    } else {
      localStorage.removeItem('tenantSlug');
    }
  }, [hydrated, tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    if (userName) {
      storeUserName(userName);
    } else {
      localStorage.removeItem('userName');
    }
  }, [hydrated, userName]);

  const login = (newToken: string, slug?: string, nextUserName?: string) => {
    setToken(newToken);
    if (slug) setTenantSlug(slug);
    if (nextUserName) setUserName(nextUserName);
  };

  const logout = () => {
    setToken(null);
    setTenantSlug(null);
    setUserName(null);
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      token,
      tenantSlug,
      userName,
      isAuthenticated: Boolean(token),
      hydrated,
      login,
      logout,
      setTenant: setTenantSlug,
    }),
    [token, tenantSlug, userName, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
