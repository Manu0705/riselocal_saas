import { Router } from "express";
import { PrismaTenantRepository } from "../infrastructure/tenant.prisma.repository";
import { Tenant } from "../domain/tenant.entity";
import { authMiddleware } from "../../auth/presentation/auth.middleware";
import { adminRoleMiddleware } from "../../auth/presentation/admin-role.middleware";
import { prisma } from "@saas/database"

const router = Router();
const repository = new PrismaTenantRepository();

function getTenantErrorResponse(error: any) {
  const message = String(error?.message || "")
  const code = String(error?.code || "")
  const target = Array.isArray(error?.meta?.target) ? error.meta.target : []

  if (code === "P2021" || message.includes("does not exist in the current database")) {
    return {
      status: 500,
      message: "Database schema is not initialized. Run Prisma migrations.",
    }
  }

  if (code === "P2002") {
    if (target.includes("slug")) {
      return {
        status: 400,
        message: "Tenant slug already exists.",
      }
    }

    if (target.includes("domain")) {
      return {
        status: 400,
        message: "Custom domain already exists.",
      }
    }

    return {
      status: 400,
      message: "A tenant with the same unique values already exists.",
    }
  }

  return {
    status: 400,
    message: message || "Failed to save tenant.",
  }
}

const RESERVED_SLUGS = [
  "dashboard",
  "admin",
  "analytics",
  "leads",
  "followups",
  "feedback",
  "tenants",
  "settings",
  "login",
  "api",
  "_next",
  "qa",
  "www",
]

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

router.post("/tenants", authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const { name, domain, slug } = req.body;

    const resolvedSlug = toSlug(slug || name || "")
    
    if (RESERVED_SLUGS.includes(resolvedSlug)) {
      return res.status(400).json({
        success: false,
        message: `Slug "${resolvedSlug}" is reserved and cannot be used`,
      });
    }

    const tenant = Tenant.create(name, resolvedSlug, domain);

    await repository.save(tenant);

    return res.status(201).json({
      success: true,
      data: tenant.toJSON(),
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error)

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   GET TENANT BY SLUG
   GET /tenants/slug/:slug
========================================= */

router.get("/tenants/slug/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim().toLowerCase()
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
        galleryImages: {
          orderBy: [{ category: "asc" }, { position: "asc" }],
        },
        services: {
          orderBy: { position: "asc" },
        },
        socialLinks: true,
      },
    })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      })
    }

    const publicTenant = {
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      settings: tenant.settings
        ? {
            logoUrl: tenant.settings.logoUrl,
            bannerUrl: tenant.settings.bannerUrl,
            logoShape: tenant.settings.logoShape,
            primaryColor: tenant.settings.primaryColor,
            secondaryColor: tenant.settings.secondaryColor,
            sectionOrder: tenant.settings.sectionOrder,
            businessPhone: tenant.settings.businessPhone,
            businessWhatsApp: tenant.settings.businessWhatsApp,
            tagline: tenant.settings.tagline,
          }
        : null,
      galleryImages: tenant.galleryImages.map((image) => ({
        url: image.url,
        category: image.category,
        position: image.position,
        alt: image.alt,
      })),
      services: tenant.services.map((service) => ({
        name: service.name,
        description: service.description,
        icon: service.icon,
        position: service.position,
      })),
      socialLinks: tenant.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label,
      })),
    }

    return res.json({
      success: true,
      data: publicTenant,
    })
  } catch (error: any) {
    const response = getTenantErrorResponse(error)

    return res.status(response.status).json({
      success: false,
      message: response.message,
    })
  }
});

router.use("/tenants", authMiddleware, adminRoleMiddleware)

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
    const response = getTenantErrorResponse(error)

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   UPDATE TENANT
   PUT /tenants/:id
========================================= */

router.put("/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, domain } = req.body;

    const tenant = await repository.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const resolvedSlug = toSlug(slug || name || "");
    tenant.update(name, resolvedSlug, domain);

    await repository.update(tenant);

    return res.json({
      success: true,
      data: tenant.toJSON(),
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error)

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   DELETE TENANT
   DELETE /tenants/:id
========================================= */

router.delete("/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await repository.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    await repository.delete(id);

    return res.json({
      success: true,
      message: "Tenant deleted successfully",
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error)

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

export default router;