"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const ok = await login(password)
    setSubmitting(false)

    if (ok) {
      router.push("/dashboard")
    } else {
      setError("Invalid password")
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div className="card" style={{ maxWidth: 400, width: "100%" }}>
        <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 700 }}>Admin Panel</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Enter password to access
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                fontSize: 16,
              }}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: "var(--danger)", marginBottom: 16, fontSize: 14 }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Default password: admin123
          </p>
        </form>
      </div>
    </div>
  )
}
