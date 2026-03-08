"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, MessageSquare, BarChart3, LogOut } from "lucide-react"
import { logout } from "@/lib/auth"
import RequireAuth from "@/components/require-auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tenants", href: "/dashboard/tenants", icon: Users },
    { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ]

  return (
    <RequireAuth>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside style={{
          width: 260,
          background: "#1e293b",
          color: "white",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>Multi-Tenant SaaS</p>
          </div>

          <nav style={{ flex: 1 }}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 8,
                    marginBottom: 8,
                    textDecoration: "none",
                    color: isActive ? "white" : "#94a3b8",
                    background: isActive ? "#3b82f6" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontWeight: 400,
              fontSize: 16,
              width: "100%",
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </RequireAuth>
  )
}
