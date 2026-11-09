// Foto de celular tem 4–8 MB. Antes de enviar, reduz para no máximo 1600px e salva em JPEG:
// fica com uns 200–400 KB, sobe rápido no 4G e ocupa pouco espaço no servidor.
const MAX_SIZE = 1600
const QUALITY = 0.8

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null)

  // formato que o navegador não abre: manda o original e o servidor decide se aceita
  if (!bitmap) return file

  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) return file

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}
