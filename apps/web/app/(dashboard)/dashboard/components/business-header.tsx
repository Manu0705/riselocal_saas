"use client"

import { useRouter, usePathname } from "next/navigation"

export default function BusinessHeader({ title }: { title?: string }) {

  const router = useRouter()
  const pathname = usePathname()

  const isDashboard = pathname === "/dashboard"

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        borderBottom: "1px solid #eee",
        fontWeight: 600,
        fontSize: 12
      }}
    >
      {/* Dashboard screen */}
      {isDashboard ? (
        <>
          <button
            onClick={() => router.push("/default")}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "default",
              width: 34,
              height: 34,
              borderRadius: 999,
              boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
            }}
          >
            &lt;
          </button>

          <span style={{ marginLeft: 10 }}>
            Dashboard
          </span>
        </>
      ) : (
        <>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              border: "none",
              background: "none",
              fontSize: 20,
              cursor: "default"
            }}
          >
            ☰
          </button>

          <span style={{ marginLeft: 12 }}>
            {title}
          </span>
        </>
      )}

    </div>
  )
}