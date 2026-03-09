import { ChevronRight, Globe, MapPin } from "lucide-react"

type Props = {
  readonly tenant: {
    readonly name?: string
    readonly tagline?: string
    readonly phone?: string
    readonly whatsapp?: string
    readonly address?: string
    readonly instagram?: string
    readonly facebook?: string
    readonly website?: string
  }
}

export default function Hero({ tenant }: Props) {
  const phone = tenant?.phone ?? ""

  const withProtocol = (url?: string) => {
    if (!url) return ""
    return /^https?:\/\//i.test(url) ? url : `https://${url}`
  }

  const tenantSocialLinks = [
    { label: "Instagram", href: withProtocol(tenant?.instagram), icon: <Globe size={16} /> },
    { label: "Facebook", href: withProtocol(tenant?.facebook), icon: <Globe size={16} /> },
    { label: "Website", href: withProtocol(tenant?.website), icon: <Globe size={16} /> },
  ].filter((item) => Boolean(item.href))

  const dummySocialLinks = [
    { label: "Instagram", href: "https://instagram.com", icon: <Globe size={16} /> },
    { label: "Facebook", href: "https://facebook.com", icon: <Globe size={16} /> },
    { label: "Website", href: "https://example.com", icon: <Globe size={16} /> },
  ]

  const socialLinks = tenantSocialLinks.length ? tenantSocialLinks : dummySocialLinks

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Slide 1: Banner */}
        <section
          style={{
            minWidth: "100%",
            scrollSnapAlign: "start",
            borderRadius: 14,
            border: "1px solid var(--card-border)",
            overflow: "hidden",
            background: "var(--card)",
          }}
        >
          <img
            src="https://api.maptiler.com/maps/streets/static/-74.0060,40.7128,13/600x300.png?key=YOUR_KEY"
            alt="Store location map"
            style={{
              width: "100%",
              height: 180,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {tenant?.name || "Business Banner"}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 0" }}>
              {tenant?.tagline || "Premium curtains and blinds for your home."}
            </p>
          </div>
        </section>

        {/* Slide 2: Visiting Card Details */}
        <section
          style={{
            minWidth: "100%",
            scrollSnapAlign: "start",
            borderRadius: 14,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
            padding: 14,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 12 }}>
            <MapPin size={16} />
            Visiting Card Details
          </div>

          <div
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 8,
              background: "rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {tenant?.name || "Business Name"}
            </div>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {tenant?.tagline || "Your business tagline"}
            </div>

            <div style={{ fontSize: 13 }}>
              <strong>Phone:</strong> {phone || "N/A"}
            </div>

            <div style={{ fontSize: 13 }}>
              <strong>Address:</strong> {tenant?.address || "Home visit available in nearby areas"}
            </div>

            <div style={{ fontSize: 13 }}>
              <strong>Hours:</strong> 10:00 AM - 8:00 PM
            </div>
          </div>
        </section>

        {/* Slide 3: Social Links */}
        <section
          style={{
            minWidth: "100%",
            scrollSnapAlign: "start",
            borderRadius: 14,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
            padding: 14,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Social Media</div>

          <div style={{ display: "grid", gap: 8 }}>
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textDecoration: "none",
                  color: "var(--text)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight size={16} />
              </a>
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--card-border)" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--card-border)" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--card-border)" }} />
      </div>
    </div>
  )
}