"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react"
import { getTenantApiClient } from "@/lib/tenant-client"

interface Service {
  id: string
  name: string
  description?: string
  icon?: string
  position: number
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", icon: "" })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const api = getTenantApiClient()
      const response = await api.get("/services")
      if (response?.data) {
        setServices(response.data)
      }
    } catch (error) {
      console.error("Failed to load services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Service name is required")
      return
    }

    try {
      const api = getTenantApiClient()
      const response = await api.post("/services", formData)
      if (response?.data) {
        setServices([...services, response.data])
        setFormData({ name: "", description: "", icon: "" })
      }
    } catch (error) {
      console.error("Failed to create service:", error)
      alert("Failed to create service")
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const api = getTenantApiClient()
      const response = await api.put(`/services/${id}`, formData)
      if (response?.data) {
        setServices(services.map((s) => (s.id === id ? response.data : s)))
        setEditingId(null)
        setFormData({ name: "", description: "", icon: "" })
      }
    } catch (error) {
      console.error("Failed to update service:", error)
      alert("Failed to update service")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return

    try {
      const api = getTenantApiClient()
      await api.delete(`/services/${id}`)
      setServices(services.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Failed to delete service:", error)
      alert("Failed to delete service")
    }
  }

  const startEdit = (service: Service) => {
    setEditingId(service.id)
    setFormData({
      name: service.name,
      description: service.description || "",
      icon: service.icon || "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", icon: "" })
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
        <Loader2 size={24} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 12 }}>Loading services...</p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Add/Edit Form */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          {editingId ? "Edit Service" : "Add New Service"}
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          <input
            type="text"
            placeholder="Service name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <input
            type="text"
            placeholder="Icon name (optional, e.g., star, shield, zap)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {editingId ? (
              <>
                <button
                  onClick={() => handleUpdate(editingId)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    border: "1px solid var(--card-border)",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "10px 16px",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={handleCreate}
                style={{
                  flex: 1,
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Plus size={16} />
                Add Service
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <p>No services added yet</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Add your first service using the form above</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                border: "1px solid var(--card-border)",
                background: "var(--card)",
                borderRadius: 10,
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {service.icon && (
                    <span
                      style={{
                        background: "#eff6ff",
                        color: "#3b82f6",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {service.icon}
                    </span>
                  )}
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{service.name}</h4>
                </div>
                {service.description && (
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{service.description}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => startEdit(service)}
                  style={{
                    border: "none",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    borderRadius: 6,
                    padding: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{
                    border: "none",
                    background: "#fef2f2",
                    color: "#dc2626",
                    borderRadius: 6,
                    padding: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
        💡 Drag to reorder coming soon
      </p>
    </div>
  )
}
