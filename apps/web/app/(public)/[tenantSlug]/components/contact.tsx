import { buttonStyles } from "@/lib/ui-constants"

type Props = {
  readonly tenant?: {
    readonly phone?: string
    readonly name?: string
  }
}

export default function Contact({ tenant }: Readonly<Props>) {

  const phone = tenant?.phone || ""

  return (
    <div style={{ padding: 16 }}>

      <h2 style={{ marginBottom: 12 }}>
        Contact
      </h2>

      <div style={{ display: "grid", gap: 10 }}>

        <a
          href={`tel:${phone}`}
          style={{
            ...buttonStyles.call,
            marginTop: 0,
          }}
        >
          Call Now
        </a>

        <a
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