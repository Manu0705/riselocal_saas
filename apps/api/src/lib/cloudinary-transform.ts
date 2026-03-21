/**
 * Adds Cloudinary transformation parameters to image URLs for responsive optimization.
 * Enables auto-format (WebP, AVIF), auto quality, and preserves original URL for non-Cloudinary images.
 */
export function optimizeCloudinaryUrl(url: string | undefined | null): string {
  if (!url) return '';

  // Only apply transforms to Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Check if URL already has transformation parameters
  const hasTransform = url.includes('/c_') || url.includes('/w_') || url.includes('/f_');
  if (hasTransform) {
    return url;
  }

  // Insert transformation parameters before the file version
  // URL structure: .../upload/[TRANSFORMS]/v{version}/filename
  const uploadStr = '/upload/';
  const uploadIndex = url.indexOf(uploadStr);

  if (uploadIndex === -1) {
    return url;
  }

  const beforeUpload = url.substring(0, uploadIndex + uploadStr.length);
  const afterUpload = url.substring(uploadIndex + uploadStr.length);

  // Transformation parameters:
  // c_fill - crop and fill
  // f_auto - auto-format (WebP, AVIF for modern browsers)
  // q_auto:best - auto quality optimization
  const transforms = 'f_auto,q_auto:best,c_limit';

  return `${beforeUpload}${transforms}/${afterUpload}`;
}
