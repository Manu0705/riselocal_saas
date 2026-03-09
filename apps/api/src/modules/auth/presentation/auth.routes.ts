import { Router } from "express";
import { JwtService } from "../infrastructure/jwt.service";
import { PrismaTenantRepository } from "../../tenant/infrastructure/tenant.prisma.repository";

const router = Router();
const jwtService = new JwtService();
const tenantRepository = new PrismaTenantRepository();

router.post("/login", async (req, res) => {
  const { email, password, tenantId } = req.body as {
    email?: string
    password?: string
    tenantId?: string
    tenantSlug?: string
  }

  const tenantSlug = typeof req.body?.tenantSlug === "string" ? req.body.tenantSlug.trim().toLowerCase() : ""

  // NOTE: This is a simplified auth flow for demo purposes.
  // In a real app, you'd validate email/password against a user database.
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  const userId = email.trim().toLowerCase()
  let resolvedTenantId = tenantId ? String(tenantId).trim() : "default"

  if (tenantSlug) {
    const tenant = await tenantRepository.findBySlug(tenantSlug)
    if (tenant) {
      resolvedTenantId = tenant.toJSON().id
    }
  }

  const resolvedRole = "owner"

  const token = jwtService.sign({
    userId,
    tenantId: resolvedTenantId,
    role: resolvedRole,
  })

  return res.json({
    token,
    user: {
      userId,
      tenantId: resolvedTenantId,
      role: resolvedRole,
    },
  })
});

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string
    password?: string
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  const configuredAdminPassword = process.env.ADMIN_PASSWORD || "admin123"
  if (password !== configuredAdminPassword) {
    return res.status(401).json({ error: "Invalid admin credentials" })
  }

  const userId = email.trim().toLowerCase()
  const token = jwtService.sign({
    userId,
    tenantId: "admin",
    role: "admin",
  })

  return res.json({
    token,
    user: {
      userId,
      tenantId: "admin",
      role: "admin",
    },
  })
})

export default router;