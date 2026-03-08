// Shared UI constants to eliminate duplication

export const buttonStyles = {
  whatsapp: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    background: "#25D366",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 500,
    textDecoration: "none" as const,
    marginTop: 10,
  },
  call: {
    display: "block",
    textAlign: "center" as const,
    padding: 12,
    borderRadius: 10,
    background: "#3b82f6",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    marginTop: 10,
  },
}

export const headerDimensions = {
  logo: {
    width: 28,
    height: 28,
  },
  menu: {
    width: 28,
    height: 28,
    lineWidth: 20,
    lineHeight: 2,
  },
}

export const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
}
