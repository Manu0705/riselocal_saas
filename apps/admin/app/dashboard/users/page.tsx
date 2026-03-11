"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/api-client"

type Tenant = {
  id: string
  name: string
  slug: string
}

type TenantUser = {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function TenantUsersPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState("")
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner",
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (!tenantId) {
      setUsers([])
      return
    }

    fetchUsers(tenantId)
  }, [tenantId])

  async function fetchTenants() {
    setLoading(true)
    try {
      const response = await adminApi.get("/tenants")
      const data = Array.isArray(response) ? response : response?.data || []
      setTenants(data)

      if (data.length > 0) {
        setTenantId(data[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch tenants", error)
      alert("Failed to fetch tenants")
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers(id: string) {
    try {
      const response = await adminApi.get(`/tenant-users?tenantId=${encodeURIComponent(id)}`)
      const data = Array.isArray(response) ? response : response?.data || []
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch tenant users", error)
      alert("Failed to fetch tenant users")
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!tenantId) {
      alert("Select a tenant first")
      return
    }

    if (formData.password.trim().length < 8) {
      alert("Password must be at least 8 characters")
      return
    }

    setSubmitting(true)
    try {
      await adminApi.post("/tenant-users", {
        tenantId,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "owner",
      })

      await fetchUsers(tenantId)
    } catch (error) {
      console.error("Failed to create tenant user", error)
      alert("Failed to create tenant user")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(user: TenantUser) {
    try {
      await adminApi.put(`/tenant-users/${user.id}`, {
        isActive: !user.isActive,
      })
      await fetchUsers(tenantId)
    } catch (error) {
      console.error("Failed to update user", error)
      alert("Failed to update user")
    }
  }

  async function removeUser(user: TenantUser) {
    if (!confirm(`Delete user ${user.email}?`)) {
      return
    }

    try {
      await adminApi.delete(`/tenant-users/${user.id}`)
      await fetchUsers(tenantId)
    } catch (error) {
      console.error("Failed to delete user", error)
      alert("Failed to delete user")
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading users...</p>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Tenant User Access</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Create login accounts for tenant owners/staff and control their access.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <label htmlFor="tenantSelect" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
          Select Tenant
        </label>
        <select
          id="tenantSelect"
          className="input"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} ({tenant.slug})
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Create Tenant Login</h2>

        <form onSubmit={handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <input
              id="tenant-user-name"
              name="name"
              className="input"
              placeholder="Full name"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              id="tenant-user-email"
              name="email"
              className="input"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              id="tenant-user-password"
              name="password"
              className="input"
              placeholder="Password (min 8 chars)"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
            />
            <select
              id="tenant-user-role"
              name="role"
              aria-label="User role"
              className="input"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 14 }} disabled={submitting}>
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Existing Tenant Users</h2>

        {users.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No users found for this tenant.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? "Active" : "Disabled"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => toggleActive(user)}>
                        {user.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn"
                        style={{ background: "#ef4444", color: "#fff" }}
                        onClick={() => removeUser(user)}
                      >
                        Delete
                      </button>
                    </div>
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
