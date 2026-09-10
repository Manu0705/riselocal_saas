'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuth as clearStoredAuth,
  getTenantSlug as getStoredTenantSlug,
  getToken as getStoredToken,
  getUserName as getStoredUserName,
  getUserRole as getStoredUserRole,
  setTenantSlug as storeTenantSlug,
  setUserName as storeUserName,
  setUserRole as storeUserRole,
} from '@/lib/auth';

type AuthContextValue = {
  token: string | null;
  tenantSlug: string | null;
  userName: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (token: string, tenantSlug?: string, userName?: string, userRole?: string) => void;
  logout: () => void;
  setTenant: (slug: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Load stored auth only on the client after hydration.
    setToken(getStoredToken());
    setTenantSlug(getStoredTenantSlug());
    setUserName(getStoredUserName());
    setUserRole(getStoredUserRole());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (token) {
        sessionStorage.setItem('token', token);
      } else {
        sessionStorage.removeItem('token');
      }
    } catch {
      // Ignore transient storage failures on restored tabs/private browsing.
    }
  }, [hydrated, token]);

  useEffect(() => {
    if (!hydrated) return;
    if (tenantSlug) {
      storeTenantSlug(tenantSlug);
    } else {
      try {
        sessionStorage.removeItem('tenantSlug');
      } catch {
        // Ignore transient storage failures on restored tabs/private browsing.
      }
    }
  }, [hydrated, tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    if (userName) {
      storeUserName(userName);
    } else {
      try {
        sessionStorage.removeItem('userName');
      } catch {
        // Ignore transient storage failures on restored tabs/private browsing.
      }
    }
  }, [hydrated, userName]);

  useEffect(() => {
    if (!hydrated) return;
    if (userRole) {
      storeUserRole(userRole);
    } else {
      try {
        sessionStorage.removeItem('userRole');
      } catch {
        // Ignore transient storage failures on restored tabs/private browsing.
      }
    }
  }, [hydrated, userRole]);

  const login = (newToken: string, slug?: string, nextUserName?: string, nextUserRole?: string) => {
    setToken(newToken);
    if (slug) setTenantSlug(slug);
    if (nextUserName) setUserName(nextUserName);
    if (nextUserRole) setUserRole(nextUserRole);
  };

  const logout = () => {
    setToken(null);
    setTenantSlug(null);
    setUserName(null);
    setUserRole(null);
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      token,
      tenantSlug,
      userName,
      userRole,
      isAuthenticated: Boolean(token),
      hydrated,
      login,
      logout,
      setTenant: setTenantSlug,
    }),
    [token, tenantSlug, userName, userRole, hydrated],
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
