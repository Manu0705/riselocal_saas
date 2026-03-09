import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export async function uploadToCloudinary(
  filePath: string,
  folder: string,
  resourceType: "auto" | "image" | "video" = "auto"
) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `riselocal/${folder}`,
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId)
    return { success: true }
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return { success: false, error }
  }
}
