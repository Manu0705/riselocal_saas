"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  clearAuth as clearStoredAuth,
  getTenantSlug as getStoredTenantSlug,
  getToken as getStoredToken,
  setTenantSlug as storeTenantSlug,
} from "@/lib/auth"

type AuthContextValue = {
  token: string | null
  tenantSlug: string | null
  isAuthenticated: boolean
  hydrated: boolean
  login: (token: string, tenantSlug?: string) => void
  logout: () => void
  setTenant: (slug: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Load stored auth only on the client after hydration.
    setToken(getStoredToken())
    setTenantSlug(getStoredTenantSlug())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (token) {
      localStorage.setItem("token", token)
    } else {
      localStorage.removeItem("token")
    }
  }, [hydrated, token])

  useEffect(() => {
    if (!hydrated) return
    if (tenantSlug) {
      storeTenantSlug(tenantSlug)
    } else {
      localStorage.removeItem("tenantSlug")
    }
  }, [hydrated, tenantSlug])

  const login = (newToken: string, slug?: string) => {
    setToken(newToken)
    if (slug) setTenantSlug(slug)
  }

  const logout = () => {
    setToken(null)
    setTenantSlug(null)
    clearStoredAuth()
  }

  const value = useMemo(
    () => ({
      token,
      tenantSlug,
      isAuthenticated: Boolean(token),
      hydrated,
      login,
      logout,
      setTenant: setTenantSlug,
    }),
    [token, tenantSlug, hydrated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
