"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"
import { getTenantApiClient } from "@/lib/tenant-client"

interface TenantSettings {
  id: string
  logoUrl?: string
  bannerUrl?: string
  logoShape: "circle" | "square"
  primaryColor: string
  secondaryColor: string
  tagline?: string
  businessPhone?: string
  businessWhatsApp?: string
}

export default function BrandingEditor() {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null)
  const searchParams = useSearchParams()
  const tenant = searchParams.get("tenant")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const api = getTenantApiClient()
      const response = await api.get("/settings")
      if (response?.data) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (type: "logo" | "banner", file: File) => {
    if (!file) return

    setUploading(type)
    try {
      const api = getTenantApiClient()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const uploadResponse = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (uploadResponse?.url) {
        const fieldName = type === "logo" ? "logoUrl" : "bannerUrl"
        const updateResponse = await api.put("/settings", {
          [fieldName]: uploadResponse.url,
        })

        if (updateResponse?.data) {
          setSettings(updateResponse.data)
        }
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error)
      alert(`Failed to upload ${type}. Please try again.`)
    } finally {
      setUploading(null)
    }
  }

  const handleUpdate = async (updates: Partial<TenantSettings>) => {
    setSaving(true)
    try {
      const api = getTenantApiClient()
      const response = await api.put("/settings", updates)
      if (response?.data) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
        <Loader2 size={24} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 12 }}>Loading settings...</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "#dc2626" }}>Failed to load settings</p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Logo Upload */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Logo
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo"
              style={{
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: settings.logoShape === "circle" ? "50%" : 8,
                border: "2px solid var(--card-border)",
              }}
            />
          )}
          <label
            style={{
              flex: 1,
              border: "2px dashed var(--card-border)",
              borderRadius: 8,
              padding: 16,
              textAlign: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            {uploading === "logo" ? (
              <Loader2 size={20} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                <Upload size={20} style={{ marginBottom: 4 }} />
                <div>Click to upload logo</div>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleImageUpload("logo", e.target.files[0])}
            />
          </label>
        </div>

        {/* Logo Shape */}
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Logo Shape
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {["circle", "square"].map((shape) => (
              <button
                key={shape}
                onClick={() => handleUpdate({ logoShape: shape as "circle" | "square" })}
                style={{
                  flex: 1,
                  border: settings.logoShape === shape ? "2px solid #3b82f6" : "1px solid var(--card-border)",
                  background: settings.logoShape === shape ? "#eff6ff" : "transparent",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: settings.logoShape === shape ? "#3b82f6" : "var(--text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner Upload */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Banner Image
        </label>
        {settings.bannerUrl && (
          <img
            src={settings.bannerUrl}
            alt="Banner"
            style={{
              width: "100%",
              height: 120,
              objectFit: "cover",
              borderRadius: 8,
              marginBottom: 12,
              border: "1px solid var(--card-border)",
            }}
          />
        )}
        <label
          style={{
            display: "block",
            border: "2px dashed var(--card-border)",
            borderRadius: 8,
            padding: 20,
            textAlign: "center",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          {uploading === "banner" ? (
            <Loader2 size={20} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <>
              <Upload size={20} style={{ marginBottom: 4 }} />
              <div>Click to upload banner</div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleImageUpload("banner", e.target.files[0])}
          />
        </label>
      </div>

      {/* Colors */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Brand Colors
        </label>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Primary Color
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                style={{ width: 48, height: 48, border: "1px solid var(--card-border)", borderRadius: 8, cursor: "pointer" }}
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                style={{
                  flex: 1,
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Secondary Color
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                style={{ width: 48, height: 48, border: "1px solid var(--card-border)", borderRadius: 8, cursor: "pointer" }}
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => handleUpdate({ secondaryColor: e.target.value })}
                style={{
                  flex: 1,
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Business Tagline
        </label>
        <input
          type="text"
          value={settings.tagline || ""}
          onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
          onBlur={() => handleUpdate({ tagline: settings.tagline })}
          placeholder="e.g., Your trusted home service provider"
          style={{
            width: "100%",
            border: "1px solid var(--card-border)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 14,
          }}
        />
      </div>

      {/* Contact Info */}
      <div
        style={{
          border: "1px solid var(--card-border)",
          background: "var(--card)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Contact Information
        </label>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Business Phone
            </label>
            <input
              type="tel"
              value={settings.businessPhone || ""}
              onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
              onBlur={() => handleUpdate({ businessPhone: settings.businessPhone })}
              placeholder="+1 234 567 8900"
              style={{
                width: "100%",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={settings.businessWhatsApp || ""}
              onChange={(e) => setSettings({ ...settings, businessWhatsApp: e.target.value })}
              onBlur={() => handleUpdate({ businessWhatsApp: settings.businessWhatsApp })}
              placeholder="+1 234 567 8900"
              style={{
                width: "100%",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </div>

      {saving && (
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          Saving changes...
        </div>
      )}
    </div>
  )
}
