/**
 * Upload a File to Cloudinary using a signed upload (no preset needed).
 * Quality is set to 100 (lossless) and format is preserved.
 * Returns the secure_url of the uploaded image.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const API_KEY     = import.meta.env.VITE_CLOUDINARY_API_KEY     as string
const API_SECRET  = import.meta.env.VITE_CLOUDINARY_API_SECRET  as string

/** Generate SHA-1 signature required by Cloudinary signed upload */
const sha1 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const folder    = 'microdidact/chantiers'
  const quality   = '100'        // Maximum quality - no compression
  const format    = 'jpg'        // JPEG output (best for photos)

  // Params sorted alphabetically — ALL params except file, api_key must be signed
  const paramsToSign = [
    `folder=${folder}`,
    `format=${format}`,
    `quality=${quality}`,
    `timestamp=${timestamp}`,
  ].join('&')

  const signature = await sha1(paramsToSign + API_SECRET)

  const formData = new FormData()
  formData.append('file',      file)
  formData.append('api_key',   API_KEY)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder',    folder)
  formData.append('quality',   quality)
  formData.append('format',    format)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || `Cloudinary HTTP ${response.status}`)
  }

  const data = await response.json()
  return data.secure_url as string
}
