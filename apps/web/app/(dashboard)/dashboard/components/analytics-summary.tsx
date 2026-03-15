"use client"

import { useDashboardData } from "@/context/DashboardDataContext"

export default function AnalyticsSummary(){
  const { metrics, loading } = useDashboardData()

  const items = [
    { label: "Contacts", value: metrics.totalLeads, accent: "#22c55e" },
    { label: "New Leads", value: metrics.openLeads, accent: "#2563eb" },
    { label: "Conversion", value: `${metrics.conversionRate}%`, accent: "#f59e0b" },
  ]

  return (
    <div
      style={{
        marginTop:24,
        padding:20,
        border:"1px solid var(--card-border)",
        borderRadius:12,
        background:"var(--card)",
        boxShadow:"0 4px 12px var(--shadow)"
      }}
    >

      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>Analytics Summary</h4>

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",
          gap:10,
          marginTop:12
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: 12,
              background: "var(--card)",
            }}
          >
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>{item.label}</p>
            <strong style={{ color: item.accent, fontSize: 24, fontWeight: 600, display: "block", marginTop: 6, letterSpacing: "-0.5px" }}>
              {loading ? "--" : item.value}
            </strong>
          </div>
        ))}
      </div>

    </div>
  )
}