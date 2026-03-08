import { Router } from "express";
import { JwtService } from "../infrastructure/jwt.service";
import { PrismaTenantRepository } from "../../tenant/infrastructure/tenant.prisma.repository";

const router = Router();
const jwtService = new JwtService();
const tenantRepository = new PrismaTenantRepository();

router.post("/login", async (req, res) => {
  const { email, password, tenantId, role } = req.body as {
    email?: string
    password?: string
    tenantId?: string
    tenantSlug?: string
    role?: string
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

  const resolvedRole = role ? String(role).trim() : "owner"

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

export default router;