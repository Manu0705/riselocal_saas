import { Router } from "express"
import { authMiddleware } from "../../auth/presentation/auth.middleware"
import { prisma } from "@saas/database"

const router = Router()

// GET tenant settings
router.get("/settings", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: "circle",
          primaryColor: "#000000",
          secondaryColor: "#FFFFFF",
          sectionOrder: ["hero", "services", "gallery"],
        },
      })
    }

    return res.json({ success: true, data: settings })
  } catch (error: any) {
    console.error("Settings fetch error:", error)
    return res.status(500).json({ error: error.message })
  }
})

// PUT update tenant settings
router.put("/settings", authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const {
      logoShape,
      primaryColor,
      secondaryColor,
      sectionOrder,
      businessPhone,
      businessWhatsApp,
      tagline,
      logoUrl,
      bannerUrl,
    } = req.body

    // Get or create settings
    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: logoShape || "circle",
          primaryColor: primaryColor || "#000000",
          secondaryColor: secondaryColor || "#FFFFFF",
          sectionOrder,
        },
      })
    } else {
      settings = await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          ...(logoShape !== undefined && { logoShape }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(sectionOrder !== undefined && { sectionOrder }),
          ...(businessPhone !== undefined && { businessPhone }),
          ...(businessWhatsApp !== undefined && { businessWhatsApp }),
          ...(tagline !== undefined && { tagline }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(bannerUrl !== undefined && { bannerUrl }),
        },
      })
    }

    return res.json({ success: true, data: settings })
  } catch (error: any) {
    console.error("Settings update error:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router
