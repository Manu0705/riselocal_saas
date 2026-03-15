"use client"

import { buttonStyles } from "@/lib/ui-constants"
import { capturePublicCtaLead } from "@/lib/public-lead-capture"

type Props = {
  readonly tenant?: {
    readonly phone?: string
    readonly name?: string
  }
  readonly tenantId?: string
  readonly tenantSlug?: string
}

export default function Contact({ tenant, tenantId, tenantSlug }: Readonly<Props>) {

  const phone = tenant?.phone || ""

  const captureLead = (source: string) => {
    void capturePublicCtaLead({
      tenantId,
      tenantSlug,
      source,
      phone,
    })
  }

  return (
    <div style={{ padding: 16 }}>

      <h2 style={{ marginBottom: 12 }}>
        Contact
      </h2>

      <div style={{ display: "grid", gap: 10 }}>

        <a
          onClick={() => captureLead("Contact Call")}
          href={`tel:${phone}`}
          style={{
            ...buttonStyles.call,
            marginTop: 0,
          }}
        >
          Call Now
        </a>

        <a
          onClick={() => captureLead("Contact WhatsApp")}
          href={`https://wa.me/${phone}`}
          target="_blank"
          style={{
            ...buttonStyles.whatsapp,
            marginTop: 0,
          }}
        >
          WhatsApp
        </a>

      </div>

    </div>
  )
}