import { Router } from "express"
import { authMiddleware } from "../../auth/presentation/auth.middleware"
import { uploadToCloudinary } from "../../../lib/cloudinary"
import multer from "multer"
import path from "path"
import fs from "fs"
import os from "os"

const router = Router()

async function removeTempFile(filePath?: string) {
  if (!filePath || !fs.existsSync(filePath)) return
  await fs.promises.unlink(filePath)
}

// Configure multer for temporary file storage
const uploadDir = path.join(os.tmpdir(), "riselocal-uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed."))
    }
  },
})

// Upload single image
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }

    const tenantId = (req.user as any)?.tenantId
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const type = (req.body.type || "gallery") as string

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path, `tenant-${tenantId}/${type}`)

    // Clean up temporary file
    await removeTempFile(req.file.path)

    if (!uploadResult.success) {
      return res.status(400).json({ error: uploadResult.error })
    }

    return res.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    })
  } catch (error: any) {
    // Clean up on error
    await removeTempFile(req.file?.path)

    console.error("Upload error:", error)
    return res.status(500).json({ error: error.message || "Upload failed" })
  }
})

export default router
