import fs from 'node:fs'
import path from 'node:path'

// Em produção essa pasta é um volume do Docker, para as fotos não sumirem a cada deploy.
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export const MAX_PHOTOS = 5
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

export const PHOTO_EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
}

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

export function removePhotos(fileNames: string[]) {
    for (const fileName of fileNames) {
        fs.rm(path.join(UPLOADS_DIR, path.basename(fileName)), { force: true }, () => {})
    }
}

export function uploadErrorMessage(error: unknown) {
    const code = (error as { code?: string })?.code

    if (code === 'FST_REQ_FILE_TOO_LARGE') return 'Cada foto pode ter no máximo 8 MB.'
    if (code === 'FST_FILES_LIMIT') return `Envie no máximo ${MAX_PHOTOS} fotos.`

    return 'Não foi possível receber as fotos.'
}
