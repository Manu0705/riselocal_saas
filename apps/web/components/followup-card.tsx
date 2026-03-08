export default function FollowupCard({
  item,
}: Readonly<{ item: Record<string, any> }>) {
  return (
    <div
      style={{
        border:"1px solid var(--card-border)",
        borderRadius: 12,
        padding:12,
        background: "var(--card)",
        boxShadow: "0 8px 18px var(--shadow)",
      }}
    >
      <p style={{ margin: 0, color: "var(--text)", fontWeight: 600 }}>
        {item.name ?? item.customerName ?? "Lead"}
      </p>
      <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
        Follow-up: {item.date ?? item.followUpAt ?? "TBD"}
      </p>
    </div>
  )
}