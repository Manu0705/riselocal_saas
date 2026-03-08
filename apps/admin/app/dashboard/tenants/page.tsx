"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { adminApi } from "@/lib/api-client"

type Tenant = {
  id: string
  name: string
  slug: string
  domain: string | null
  createdAt: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  async function fetchTenants() {
    try {
      const response = await adminApi.get("/tenants")
      const data = Array.isArray(response) ? response : response?.data || []
      setTenants(data)
    } catch (error) {
      console.error("Error fetching tenants:", error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingTenant(null)
    setFormData({ name: "", slug: "", domain: "" })
    setShowModal(true)
  }

  function openEditModal(tenant: Tenant) {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || "",
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingTenant) {
        await adminApi.put(`/tenants/${editingTenant.id}`, formData)
      } else {
        await adminApi.post("/tenants", formData)
      }
      setShowModal(false)
      fetchTenants()
    } catch (error) {
      console.error("Error saving tenant:", error)
      alert("Failed to save tenant. Please try again.")
    }
  }

  async function handleDelete(tenant: Tenant) {
    if (!confirm(`Delete ${tenant.name}? This action cannot be undone.`)) return
    try {
      await adminApi.delete(`/tenants/${tenant.id}`)
      fetchTenants()
    } catch (error) {
      console.error("Error deleting tenant:", error)
      alert("Failed to delete tenant. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading tenants...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Tenant Management</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage all tenants and their settings</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} style={{ marginRight: 8 }} />
          Add Tenant
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 18, marginBottom: 16, color: "var(--text-muted)" }}>No tenants found</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} style={{ marginRight: 8 }} />
            Create Your First Tenant
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Slug</th>
                <th>Domain</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td style={{ fontWeight: 600 }}>{tenant.name}</td>
                  <td><code>{tenant.slug}</code></td>
                  <td>{tenant.domain || "-"}</td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px" }}
                        onClick={() => openEditModal(tenant)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn"
                        style={{ padding: "6px 12px", background: "#ef4444", color: "white" }}
                        onClick={() => handleDelete(tenant)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: 500, maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
              {editingTenant ? "Edit Tenant" : "Create New Tenant"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="name" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Business Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input"
                  placeholder="JB Interior Curtains"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="slug" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Slug * (URL identifier)
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  className="input"
                  placeholder="jb-interior-curtains"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <small style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Used in URLs: /{formData.slug || "tenant-slug"}
                </small>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="domain" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Custom Domain (optional)
                </label>
                <input
                  id="domain"
                  type="text"
                  className="input"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTenant ? "Update" : "Create"} Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
