type Props = {
  products?: string[]
}

export default function Products({ products = [] }: Props) {

  if (!products.length) {
    return null
  }

  return (
    <div style={{ padding: 16 }}>

      <h2 style={{ marginBottom: 12 }}>
        Products
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12
        }}
      >
        {products.map((product, i) => (
          <div
            key={i}
            style={{
              padding: "16px 12px",
              borderRadius: 12,
              border: "1px solid #eee",
              background: "#fafafa",
              textAlign: "center",
              fontWeight: 500,
              fontSize: 15
            }}
          >
            {product}
          </div>
        ))}
      </div>

    </div>
  )
}