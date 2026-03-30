// ═══════════════════════════════════════════════════
// BWR WORKS — Cloudinary Helpers
// Upload + URL builder for product & customer images
// ═══════════════════════════════════════════════════

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''

/**
 * Build an optimised Cloudinary URL (auto WebP, responsive sizing)
 * @param publicId - The Cloudinary public ID of the image
 * @param options - width, height, quality, crop mode
 */
export function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: 'auto' | number
    crop?: 'fill' | 'fit' | 'thumb' | 'scale'
  } = {}
): string {
  if (!CLOUD_NAME) return publicId // Fallback if not configured

  const transforms: string[] = ['f_auto'] // Auto format (WebP where supported)

  if (options.quality) transforms.push(`q_${options.quality}`)
  if (options.width) transforms.push(`w_${options.width}`)
  if (options.height) transforms.push(`h_${options.height}`)
  if (options.crop) transforms.push(`c_${options.crop}`)

  const transformStr = transforms.join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${publicId}`
}

/**
 * Validate a file before upload
 * Returns error message or null if valid
 */
export function validateFile(
  file: File,
  config: { maxSizeMB: number; allowedTypes: string[] }
): string | null {
  if (file.size > config.maxSizeMB * 1024 * 1024) {
    return `File too large. Maximum size is ${config.maxSizeMB}MB.`
  }
  if (!config.allowedTypes.includes(file.type)) {
    const allowed = config.allowedTypes.map((t) => t.split('/')[1]).join(', ')
    return `Invalid file type. Allowed: ${allowed}.`
  }
  return null
}

/**
 * Upload a file to Cloudinary via unsigned upload preset
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env vars
 * @returns Cloudinary secure URL
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

  if (!CLOUD_NAME || !uploadPreset) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.local'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'bwr-works') // All BWR uploads in one folder

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Upload failed')
  }

  const data = await response.json()
  return data.secure_url as string
}

/**
 * Check if a URL is a valid Cloudinary URL
 * Used server-side to validate uploaded image references
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/')
}
