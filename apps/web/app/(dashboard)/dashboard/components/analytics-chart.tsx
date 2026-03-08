"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { api } from "@/lib/api-client"
import { useAuth } from "@/context/AuthContext"

const weekData = [
  {name:"Mon",value:2},
  {name:"Tue",value:3},
  {name:"Wed",value:4},
  {name:"Thu",value:2},
  {name:"Fri",value:5}
]

const monthData = [
  {name:"Jan",value:10},
  {name:"Feb",value:14},
  {name:"Mar",value:9},
  {name:"Apr",value:18},
  {name:"May",value:12}
]

const quarterData = [
  {name:"Q1",value:42},
  {name:"Q2",value:53},
  {name:"Q3",value:39},
  {name:"Q4",value:61}
]

const yearData = [
  {name:"2022",value:148},
  {name:"2023",value:172},
  {name:"2024",value:191},
  {name:"2025",value:218},
]

const rangeOptions = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "Quarterly" },
  { key: "year", label: "Yearly" },
] as const

type RangeKey = (typeof rangeOptions)[number]["key"]

const chartTypeOptions = [
  { key: "bar", label: "Bar" },
  { key: "area", label: "Area" },
  { key: "line", label: "Line" },
] as const

type ChartTypeKey = (typeof chartTypeOptions)[number]["key"]

type TenantLite = {
  id?: string
  domain?: string | null
  slug?: string | null
  createdAt?: string
}

function toArrayPayload(data: unknown): any[] {
  if (Array.isArray((data as { data?: unknown[] })?.data)) {
    return (data as { data: unknown[] }).data as any[]
  }

  if (Array.isArray(data)) {
    return data
  }

  return []
}

function hasReachedMonths(startDate: Date, months: number): boolean {
  const target = new Date(startDate)
  target.setMonth(target.getMonth() + months)
  return new Date() >= target
}

export default function AnalyticsChart(){
  const { tenantSlug } = useAuth()

  const [mode, setMode] = useState<RangeKey>("week")
  const [chartType, setChartType] = useState<ChartTypeKey>("bar")
  const [isMobile, setIsMobile] = useState(false)
  const [businessJoinedAt, setBusinessJoinedAt] = useState<Date | null>(null)

  useEffect(() => {
    const media = globalThis.matchMedia("(max-width: 640px)")

    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener("change", update)

    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!tenantSlug) {
      setBusinessJoinedAt(null)
      return
    }

    api
      .get("/tenants")
      .then((response) => {
        const tenants = toArrayPayload(response) as TenantLite[]
        const tenant = tenants.find((entry) => {
          const normalizedId = String(entry?.id ?? "").trim().toLowerCase()
          const normalizedDomain = (entry?.domain ?? "").trim().toLowerCase()
          const normalizedSlug = (entry?.slug ?? "").trim().toLowerCase()
          const currentTenant = tenantSlug.trim().toLowerCase()
          return (
            normalizedId === currentTenant ||
            normalizedDomain === currentTenant ||
            normalizedSlug === currentTenant
          )
        })

        if (!tenant?.createdAt) {
          setBusinessJoinedAt(null)
          return
        }

        const parsed = new Date(tenant.createdAt)
        setBusinessJoinedAt(Number.isNaN(parsed.getTime()) ? null : parsed)
      })
      .catch(() => {
        setBusinessJoinedAt(null)
      })
  }, [tenantSlug])

  const hasQuarterlyAccess = (() => {
    if (!businessJoinedAt) return false
    return hasReachedMonths(businessJoinedAt, 3)
  })()

  const hasYearlyAccess = (() => {
    if (!businessJoinedAt) return false
    return hasReachedMonths(businessJoinedAt, 12)
  })()

  const visibleRangeOptions = (() => {
    return rangeOptions.filter((option) => {
      if (option.key === "quarter") return hasQuarterlyAccess
      if (option.key === "year") return hasYearlyAccess
      return true
    })
  })()

  useEffect(() => {
    if (mode === "quarter" && !hasQuarterlyAccess) {
      setMode("month")
      return
    }

    if (mode === "year" && !hasYearlyAccess) {
      setMode("month")
    }
  }, [mode, hasQuarterlyAccess, hasYearlyAccess])

  const data = (() => {
    if (mode === "week") return weekData
    if (mode === "month") return monthData
    if (mode === "quarter") return quarterData
    return yearData
  })()

  return (
    <div style={{marginTop:20}}>

      <div 
        style={{ 
          display:"inline-flex", 
          gap: 4,
          background: "var(--card)",
          padding: 4,
          borderRadius: 8,
          border: "1px solid var(--card-border)"
        }}
      >
        {visibleRangeOptions.map((option) => {
          const active = mode === option.key

          return (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              style={{
                border: "none",
                background: active ? "#10b981" : "transparent",
                color: active ? "#ffffff" : "var(--text)",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "default",
                transition: "all 150ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div
        style={{
          height:190,
          marginTop:12,
          position: "relative",
          border: "1px solid var(--card-border)",
          borderRadius: 10,
          background: "var(--card)",
          padding: "34px 8px 8px 8px",
        }}
      >
        <div
          role="radiogroup"
          aria-label="Chart type"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {chartTypeOptions.map((option) => (
            <label
              key={option.key}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "default" }}
            >
              <input
                type="radio"
                name="analytics-chart-type"
                value={option.key}
                checked={chartType === option.key}
                onChange={() => setChartType(option.key)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={isMobile ? 12 : 30}
              />
            </BarChart>
          ) : null}

          {chartType === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.22}
                strokeWidth={2}
              />
            </AreaChart>
          ) : null}

          {chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#f59e0b" }}
              />
            </LineChart>
          ) : null}
        </ResponsiveContainer>
      </div>

    </div>
  )
}