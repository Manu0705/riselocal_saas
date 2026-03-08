"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, MessageSquare, TrendingUp, Building2 } from "lucide-react"
import { adminApi } from "@/lib/api-client"

type Tenant = {
  id: string
  name: string
  slug: string
  domain: string | null
  createdAt: string
}

type Stats = {
  totalTenants: number
  totalLeads: number
  activeLeads: number
  conversionRate: number
}

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    totalLeads: 0,
    activeLeads: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const tenantsResponse = await adminApi.get("/tenants")
      const tenantsData = Array.isArray(tenantsResponse) ? tenantsResponse : tenantsResponse?.data || []
      setTenants(tenantsData)

      // Calculate stats
      let totalLeads = 0
      let activeLeads = 0
      let convertedLeads = 0

      await Promise.all(
        tenantsData.map(async (tenant: Tenant) => {
          try {
            const leadsResponse = await adminApi.get(`/tenants/${tenant.id}/leads`)
            const leads = Array.isArray(leadsResponse) ? leadsResponse : leadsResponse?.data || []
            totalLeads += leads.length
            activeLeads += leads.filter((l: any) => l.status === "Open" || l.status === "Follow-Up").length
            convertedLeads += leads.filter((l: any) => l.status === "Converted").length
          } catch (err) {
            console.error(`Error fetching leads for tenant ${tenant.id}:`, err)
          }
        })
      )

      setStats({
        totalTenants: tenantsData.length,
        totalLeads,
        activeLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "var(--text-muted)" }}>Overview of all tenants and leads</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Total Tenants</span>
            <Building2 size={20} color="#3b82f6" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalTenants}</p>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Total Leads</span>
            <MessageSquare size={20} color="#10b981" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalLeads}</p>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Active Leads</span>
            <Users size={20} color="#f59e0b" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.activeLeads}</p>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Conversion Rate</span>
            <TrendingUp size={20} color="#ef4444" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Tenants List */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>All Tenants</h2>
          <Link href="/dashboard/tenants" className="btn btn-primary">
            View All
          </Link>
        </div>

        {tenants.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No tenants found. Run the seed script to add tenants.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Slug</th>
                <th>Domain</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 5).map((tenant) => (
                <tr key={tenant.id}>
                  <td style={{ fontWeight: 600 }}>{tenant.name}</td>
                  <td><code>{tenant.slug}</code></td>
                  <td>{tenant.domain || "-"}</td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      style={{ color: "var(--primary)", textDecoration: "none" }}
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
