import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../database/database.ts'
import { authenticate } from '../middlewares/auth.middlewares.ts'

async function getMe(req: FastifyRequest, res: FastifyReply) {
    try {
        const result = await db.query(`SELECT name FROM public.users WHERE id = $1`, [req.user.sub])

        res.code(200).send({
            id: req.user.sub,
            name: result.rows[0]?.name ?? null,
            access: req.access,
            isAdmin: req.access === 'admin'
        })
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao buscar usuário.' })
    }
}

async function getBranches(_req: FastifyRequest, res: FastifyReply) {
    try {
        const result = await db.query(`
            SELECT id, name
            FROM public.branchs
            WHERE status = true
            ORDER BY name
        `)

        res.code(200).send(result.rows)
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao buscar filiais.' })
    }
}

export async function authRoutes(fastify: FastifyInstance) {
    fastify.get('/api/auth/me', { preHandler: [authenticate] }, getMe)
    fastify.get('/api/branches', { preHandler: [authenticate] }, getBranches)
}
