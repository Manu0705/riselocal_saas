import React from "react"
import TopHeader from "./components/top-header"
import MobileContainer from "./components/mobile-container"
import { getTenant } from "@/lib/tenant-resolver"

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { tenantSlug: string }
}) {
  const tenant = await getTenant(params.tenantSlug)

  return (
    <MobileContainer>
      <TopHeader
        title={tenant.name ?? "Business"}
        tenantSlug={params.tenantSlug}
      />

      <div
        style={{
          padding: "16px",
          flex: 1
        }}
      >
        {children}
      </div>
    </MobileContainer>
  )
}