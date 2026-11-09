import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { db } from './database/database.ts'
import { MAX_PHOTOS, MAX_PHOTO_BYTES, UPLOADS_DIR } from './lib/uploads.ts'
import { authRoutes } from './routes/auth.routes.ts'
import { equipmentRoutes } from './routes/equipment.routes.ts'
import { maintenanceRoutes } from './routes/maintenance.routes.ts'

for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[name]) {
        throw new Error(`Defina ${name} no .env.`)
    }
}

const app = Fastify()

const defaultOrigins = ['http://localhost:5178', 'http://127.0.0.1:5178']

await app.register(cors, {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : defaultOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})
await app.register(cookie)
await app.register(multipart, { limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_PHOTOS, fields: 10 } })
await app.register(fastifyStatic, { root: UPLOADS_DIR, prefix: '/api/uploads/' })

app.get('/api/health', async () => {
    await db.query(`SELECT 1`)
    return { status: 'ok' }
})

app.register(authRoutes)
app.register(equipmentRoutes)
app.register(maintenanceRoutes)

const port = Number(process.env.PORT ?? 3001)

await app.listen({ host: '0.0.0.0', port })
console.log(`Servidor rodando na porta ${port}`)
