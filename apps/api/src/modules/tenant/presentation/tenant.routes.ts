import { Router } from "express";
import { PrismaTenantRepository } from "../infrastructure/tenant.prisma.repository";
import { Tenant } from "../domain/tenant.entity";

const router = Router();
const repository = new PrismaTenantRepository();

function toSlug(value: string): string {
  const unsupportedCharsRegex = /[^a-z0-9\s-]/g
  const spacesRegex = /\s+/g
  const duplicateDashRegex = /-+/g
  const edgeDashRegex = /^-|-$/g

  return value
    .trim()
    .toLowerCase()
    .replace(unsupportedCharsRegex, "")
    .replace(spacesRegex, "-")
    .replace(duplicateDashRegex, "-")
    .replace(edgeDashRegex, "")
}

/* =========================================
   CREATE TENANT
   POST /tenants
========================================= */

router.post("/tenants", async (req, res) => {
  try {
    const { name, domain, slug } = req.body;

    const resolvedSlug = toSlug(slug || name || "")
    const tenant = Tenant.create(name, resolvedSlug, domain);

    await repository.save(tenant);

    return res.status(201).json({
      success: true,
      data: tenant.toJSON(),
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================================
   GET TENANT BY SLUG
   GET /tenants/slug/:slug
========================================= */

router.get("/tenants/slug/:slug", async (req, res) => {
  try {
    const tenant = await repository.findBySlug(String(req.params.slug || "").trim().toLowerCase())

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      })
    }

    return res.json({
      success: true,
      data: tenant.toJSON(),
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
});

/* =========================================
   LIST ACTIVE TENANTS
   GET /tenants
========================================= */

router.get("/tenants", async (_req, res) => {
  try {
    const tenants = await repository.findAllActive();

    return res.json({
      success: true,
      data: tenants.map((t) => t.toJSON()),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;