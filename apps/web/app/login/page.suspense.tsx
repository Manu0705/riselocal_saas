"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { login } from "@/lib/auth"
import { useAuth } from "@/context/AuthContext"

export const dynamic = "force-dynamic"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenant = searchParams.get("tenant")

  const { login: loginWithContext } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)

    try {
      const data = await login(email, password, tenant ?? undefined)

      if (data?.error) {
        setError(data.error)
        return
      }

      if (!data?.token) {
        setError("Login failed: no token returned")
        return
      }

      const tenantIdFromServer = data?.user?.tenantId
      loginWithContext(data.token, tenant ?? tenantIdFromServer)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <h1>Login</h1>

      {error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: "#fee",
            border: "1px solid #fbb",
            borderRadius: 8,
            color: "#900",
          }}
        >
          {error}
        </div>
      ) : null}

      <input
        value={email}
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      <input
        value={password}
        placeholder="password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  )
}

export default function LoginPageWithSuspense() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
