"use client"

import { Phone } from "lucide-react"
import { buttonStyles } from "@/lib/ui-constants"
import { capturePublicCtaLead } from "@/lib/public-lead-capture"

type Props = {
  readonly phone?: string
  readonly tenantId?: string
  readonly tenantSlug?: string
}

export default function QuickActions({ phone, tenantId, tenantSlug }: Readonly<Props>) {
  const phoneNumber = phone || ""

  const captureLead = (source: string) => {
    void capturePublicCtaLead({
      tenantId,
      tenantSlug,
      source,
      phone,
    })
  }

  return (
    <div style={{ padding: "16px 16px 0 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <a
          onClick={() => captureLead("Chat on WhatsApp")}
          href={`https://wa.me/${phoneNumber}?text=Hi, I'm interested in your services`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...buttonStyles.whatsapp,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 0,
          }}
        >
          <span>Chat on Whatsapp</span>
          <span>&gt;</span>
        </a>

        <a
          onClick={() => captureLead("Call Button")}
          href={`tel:${phoneNumber}`}
          style={{
            ...buttonStyles.call,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 0,
          }}
        >
          <Phone size={18} />
          Call
        </a>
      </div>
    </div>
  )
}
