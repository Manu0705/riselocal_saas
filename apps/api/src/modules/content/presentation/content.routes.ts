import { Router } from "express"
import { authMiddleware } from "../../auth/presentation/auth.middleware"
import { prisma } from "@saas/database"

const router = Router()

// SERVICES ROUTES

// GET all services
router.get("/services", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { position: "asc" },
    })

    return res.json({ success: true, data: services })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// POST create service
router.post("/services", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const { name, description, icon } = req.body

    if (!tenantId || !name) {
      return res.status(400).json({ error: "Tenant and name are required" })
    }

    const maxPosition = await prisma.service.findFirst({
      where: { tenantId },
      orderBy: { position: "desc" },
      select: { position: true },
    })

    const service = await prisma.service.create({
      data: {
        tenantId,
        name,
        description,
        icon,
        position: (maxPosition?.position ?? -1) + 1,
      },
    })

    return res.status(201).json({ success: true, data: service })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// PUT update service
router.put("/services/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const serviceId = req.params.id as string
    const { name, description, icon, position } = req.body

    // Verify ownership
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service || service.tenantId !== tenantId) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(position !== undefined && { position }),
      },
    })

    return res.json({ success: true, data: updated })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// DELETE service
router.delete("/services/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const serviceId = req.params.id as string

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service || service.tenantId !== tenantId) {
      return res.status(403).json({ error: "Forbidden" })
    }

    await prisma.service.delete({ where: { id: serviceId } })
    return res.json({ success: true, message: "Service deleted" })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// SOCIAL LINKS ROUTES

// GET all social links
router.get("/social", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const links = await prisma.socialLink.findMany({
      where: { tenantId },
    })

    return res.json({ success: true, data: links })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// POST create social link
router.post("/social", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const { platform, url, label } = req.body

    if (!tenantId || !platform || !url) {
      return res.status(400).json({ error: "Platform and URL are required" })
    }

    const link = await prisma.socialLink.create({
      data: {
        tenantId,
        platform,
        url,
        label,
      },
    })

    return res.status(201).json({ success: true, data: link })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// PUT update social link
router.put("/social/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const linkId = req.params.id as string
    const { url, label } = req.body

    const link = await prisma.socialLink.findUnique({ where: { id: linkId } })
    if (!link || link.tenantId !== tenantId) {
      return res.status(403).json({ error: "Forbidden" })
    }

    const updated = await prisma.socialLink.update({
      where: { id: linkId },
      data: {
        ...(url && { url }),
        ...(label !== undefined && { label }),
      },
    })

    return res.json({ success: true, data: updated })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// DELETE social link
router.delete("/social/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    const linkId = req.params.id as string

    const link = await prisma.socialLink.findUnique({ where: { id: linkId } })
    if (!link || link.tenantId !== tenantId) {
      return res.status(403).json({ error: "Forbidden" })
    }

    await prisma.socialLink.delete({ where: { id: linkId } })
    return res.json({ success: true, message: "Social link deleted" })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

export default router
