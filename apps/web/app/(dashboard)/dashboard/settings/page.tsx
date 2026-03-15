"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useDashboardData } from "@/context/DashboardDataContext"
import MobilePageTitle from "../components/mobile-page-title"

export default function SettingsPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const { tenant, metrics, loading, error } = useDashboardData()

  const joinedAt = tenant?.createdAt
    ? new Date(tenant.createdAt).toLocaleDateString()
    : "N/A"

  const handleLogout = () => {
    logout()
    const tenantRouteKey = tenant?.slug ?? tenant?.id ?? "default"
    router.push(`/${tenantRouteKey}`)
  }

  return (
    <div style={{ padding: 16 }}>
      <MobilePageTitle title="Settings" />

      {loading ? <p style={{ color: "var(--muted)" }}>Loading account data...</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>Error: {error}</p> : null}

      {!loading && !error ? (
        <>
          <div
            style={{
              border: "1px solid var(--card-border)",
              background: "var(--card)",
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <p style={{ margin: 0, color: "var(--text)", fontWeight: 700, fontSize: 16 }}>
              Account Overview
            </p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Business: {tenant?.name ?? "N/A"}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Tenant ID: {tenant?.id ?? "N/A"}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Domain: {tenant?.domain ?? "N/A"}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Slug: {tenant?.slug ?? "N/A"}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Joined: {joinedAt}</p>
          </div>

          <div
            style={{
              border: "1px solid var(--card-border)",
              background: "var(--card)",
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              display: "grid",
              gap: 8,
            }}
          >
            <p style={{ margin: 0, color: "var(--text)", fontWeight: 700, fontSize: 16 }}>
              Lead Health
            </p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Total Leads: {metrics.totalLeads}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Converted Leads: {metrics.convertedLeads}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Follow-Ups: {metrics.followUpLeads}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Open Leads: {metrics.openLeads}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Conversion Rate: {metrics.conversionRate}%</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Recent Lead: {metrics.recentLeadName}</p>
            <p style={{ margin: 0, color: "var(--muted)" }}>Recent Lead Date: {metrics.recentLeadDate}</p>
          </div>
        </>
      ) : null}

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 10,
          border: "none",
          background: "#dc2626",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  )
}
