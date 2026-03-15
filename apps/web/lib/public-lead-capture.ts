import { api } from "@/lib/api-client"
import { announceDashboardDataRefresh } from "@/lib/dashboard-events"

type CaptureLeadInput = {
  tenantId?: string | null
  tenantSlug?: string | null
  source: string
  name?: string
  phone?: string
  location?: string
}

function safeText(value: string | undefined, fallback: string): string {
  const trimmed = String(value ?? "").trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function buildFallbackPhone(value?: string): string {
  const cleaned = String(value ?? "").replaceAll(/\D/g, "")
  if (cleaned.length >= 7) {
    return cleaned
  }
  return "0000000000"
}

export async function capturePublicCtaLead(input: CaptureLeadInput): Promise<boolean> {
  const tenantId = String(input.tenantId ?? "").trim()

  if (!tenantId) {
    return false
  }

  const payload = {
    name: safeText(input.name, "Walk-in Enquiry"),
    phone: buildFallbackPhone(input.phone),
    email: `${Date.now()}@visitor.local`,
    source: safeText(input.source, "Public CTA"),
    location: safeText(input.location, "Unknown"),
  }

  const response = await api.post(`/tenants/${tenantId}/leads`, payload)

  if ((response as { success?: boolean })?.success === false) {
    return false
  }

  announceDashboardDataRefresh(input.tenantSlug || tenantId)
  return true
}
