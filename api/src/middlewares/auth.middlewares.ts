import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyToken, type AuthUser } from '../utils/jwt.ts'

// slug do módulo cadastrado no hub (Administração → Módulos)
export const MODULE_SLUG = 'manutencao'

declare module 'fastify' {
    interface FastifyRequest {
        user: AuthUser
        access: string
    }
}

export async function authenticate(req: FastifyRequest, res: FastifyReply) {
    const header = req.headers.authorization
    // O site usa o cookie "token" que o hub grava. O Bearer fica para testar a API direto (curl, dev local).
    const token = (header?.startsWith('Bearer ') ? header.slice(7) : undefined) ?? req.cookies.token

    if (!token) {
        return res.code(401).send({ error: 'Autorização não encontrada.' })
    }

    try {
        req.user = verifyToken(token)
    } catch {
        return res.code(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    const permission = req.user.permissions?.find((p) => p.module === MODULE_SLUG)

    if (!permission) {
        return res.code(403).send({ error: 'O módulo de manutenção não está liberado para o seu usuário.' })
    }

    req.access = permission.access
}

export async function checkAdmin(req: FastifyRequest, res: FastifyReply) {
    if (req.access !== 'admin') {
        return res.code(403).send({ error: 'Só os administradores do módulo podem fazer isso.' })
    }
}
