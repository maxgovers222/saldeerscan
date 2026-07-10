export const MAX_VISION_SOURCE_BYTES = 10 * 1024 * 1024
export const MAX_VISION_UPLOAD_BYTES = 3 * 1024 * 1024

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function prepareVisionImage(file: File): Promise<string> {
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error('Alleen JPEG, PNG en WebP zijn toegestaan')
  }
  if (file.size > MAX_VISION_SOURCE_BYTES) {
    throw new Error('Afbeelding is te groot (max 10 MB)')
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const maxDimensions = [1600, 1280, 1024]
    const qualities = [0.85, 0.72, 0.6]

    for (const maxDim of maxDimensions) {
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Afbeelding kon niet worden verwerkt')
      ctx.drawImage(bitmap, 0, 0, width, height)

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', quality)
        })
        if (blob && blob.size <= MAX_VISION_UPLOAD_BYTES) {
          return await blobToDataUrl(blob)
        }
      }
    }

    throw new Error('Afbeelding kon niet klein genoeg worden gemaakt.')
  } finally {
    bitmap?.close()
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Afbeelding kon niet worden gelezen'))
    reader.readAsDataURL(blob)
  })
}
