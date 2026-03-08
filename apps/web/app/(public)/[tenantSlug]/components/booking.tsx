import { inputStyle } from "@/lib/ui-constants"

type Props = {
  tenant?: {
    phone?: string
  }
}

export default function Booking({ tenant }: Props) {
  return (
    <div style={{ padding: 16 }}>

      <h2 style={{ marginBottom: 12 }}>
        Book Home Visit
      </h2>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        <input
          placeholder="Your Name"
          style={inputStyle}
        />

        <input
          placeholder="Phone Number"
          style={inputStyle}
        />

        <input
          placeholder="Location"
          style={inputStyle}
        />

        <input
          type="date"
          style={inputStyle}
        />

        <button
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#000",
            color: "#fff",
            fontWeight: 600,
            cursor: "default",
          }}
        >
          Confirm Booking
        </button>
      </div>

    </div>
  )
}
