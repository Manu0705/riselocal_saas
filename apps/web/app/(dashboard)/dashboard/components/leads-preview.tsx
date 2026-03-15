"use client"

import LeadStatus from "@/components/lead-status"
import { useDashboardData } from "@/context/DashboardDataContext"

const statusOrder = ["New", "Contacted", "Follow-Up", "Converted", "Lost"] as const

function normalizeStatus(status?: string): (typeof statusOrder)[number] {
  const value = String(status ?? "").trim().toLowerCase()

  if (value === "new" || value === "open") return "New"
  if (value === "contacted") return "Contacted"
  if (value === "follow-up" || value === "qualified") return "Follow-Up"
  if (value === "converted") return "Converted"
  if (value === "lost" || value === "closed") return "Lost"

  return "New"
}

function formatLeadDate(dateText?: string): string {
  if (!dateText) return "-"
  const parsed = new Date(dateText)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
}

export default function LeadsPreview(){
  const { leads } = useDashboardData()

  const groupedByStatus = statusOrder.map((status) => {
    const latest = leads
      .filter((lead) => normalizeStatus(lead?.status) === status)
      .sort((left, right) => {
        const leftDate = new Date(left?.createdAt ?? 0).getTime()
        const rightDate = new Date(right?.createdAt ?? 0).getTime()
        return rightDate - leftDate
      })[0]

    return {
      date: formatLeadDate(latest?.createdAt),
      status,
    }
  })

  return (
    <div style={{marginTop:20}}>

      <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>Leads Summary</h3>

      <div
        style={{
          border:"1px solid var(--card-border)",
          borderRadius:12,
          padding:12,
          marginTop:10,
          background: "var(--card)",
          boxShadow: "0 4px 12px var(--shadow)",
        }}
      >
        {groupedByStatus.map((l, i)=>(
          <div
            key={`${l.date}-${l.status}-${i}`}
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems: "center",
              padding:"10px 0",
              borderBottom: i === leads.length - 1 ? "none" : "1px solid var(--card-border)",
            }}
          >
            <span style={{ color: "var(--text)", fontWeight: 500 }}>{l.date}</span>
            <LeadStatus status={l.status}/>
          </div>
        ))}
      </div>

    </div>
  )
}