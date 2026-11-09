import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../database/database.ts'
import { authenticate, checkAdmin } from '../middlewares/auth.middlewares.ts'
import { removePhotos } from '../lib/uploads.ts'
import { EQUIPMENT_TYPES, isDate, trimOrNull } from '../lib/validation.ts'

type EquipmentBody = {
    name?: string
    type?: string
    branch_id?: number | null
    location?: string
    interval_days?: number
    next_date?: string
    notes?: string
    active?: boolean
}

type IdParams = {
    id: string
}

function parseEquipment(body: EquipmentBody = {}) {
    const name = trimOrNull(body.name)
    const interval = Number(body.interval_days)

    if (!name) return { error: 'Informe o nome do equipamento.' }
    if (!body.type || !EQUIPMENT_TYPES.includes(body.type)) return { error: 'Tipo de equipamento inválido.' }
    if (!Number.isInteger(interval) || interval < 1 || interval > 730) return { error: 'Frequência inválida.' }
    if (!isDate(body.next_date)) return { error: 'Informe a data da próxima manutenção.' }

    return {
        values: [
            name,
            body.type,
            body.branch_id || null,
            trimOrNull(body.location),
            interval,
            body.next_date,
            trimOrNull(body.notes),
            body.active ?? true
        ]
    }
}

async function getEquipment(_req: FastifyRequest, res: FastifyReply) {
    try {
        const result = await db.query(`
            SELECT e.id, e.name, e.type, e.branch_id, b.name AS branch_name, e.location, e.interval_days,
                   e.next_date, e.notes, e.active, last.done_date AS last_done_date
            FROM manutencao.equipment AS e
            LEFT JOIN public.branchs AS b ON b.id = e.branch_id
            LEFT JOIN LATERAL (
                SELECT done_date
                FROM manutencao.maintenance
                WHERE equipment_id = e.id
                ORDER BY done_date DESC, id DESC
                LIMIT 1
            ) AS last ON true
            ORDER BY e.next_date, e.name
        `)

        res.code(200).send(result.rows)
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao buscar equipamentos.' })
    }
}

async function postEquipment(req: FastifyRequest<{ Body: EquipmentBody }>, res: FastifyReply) {
    const parsed = parseEquipment(req.body)

    if (parsed.error) {
        return res.code(400).send({ error: parsed.error })
    }

    try {
        await db.query(`
            INSERT INTO manutencao.equipment
            (name, type, branch_id, location, interval_days, next_date, notes, active)
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
        `, parsed.values)

        res.code(201).send({ success: 'Equipamento cadastrado.' })
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao cadastrar equipamento.' })
    }
}

async function putEquipment(req: FastifyRequest<{ Params: IdParams; Body: EquipmentBody }>, res: FastifyReply) {
    const parsed = parseEquipment(req.body)

    if (parsed.error) {
        return res.code(400).send({ error: parsed.error })
    }

    try {
        const result = await db.query(`
            UPDATE manutencao.equipment
            SET name = $1, type = $2, branch_id = $3, location = $4, interval_days = $5, next_date = $6, notes = $7, active = $8
            WHERE id = $9
        `, [...parsed.values!, Number(req.params.id)])

        if (result.rowCount === 0) {
            return res.code(404).send({ error: 'Equipamento não encontrado.' })
        }

        res.code(200).send({ success: 'Equipamento atualizado.' })
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao atualizar equipamento.' })
    }
}

async function deleteEquipment(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const id = Number(req.params.id)

    try {
        const photos = await db.query(`
            SELECT p.file_name
            FROM manutencao.maintenance_photo AS p
            JOIN manutencao.maintenance AS m ON m.id = p.maintenance_id
            WHERE m.equipment_id = $1
        `, [id])

        // as manutenções e as fotos saem junto no banco (ON DELETE CASCADE); os arquivos, aqui
        const result = await db.query(`DELETE FROM manutencao.equipment WHERE id = $1`, [id])

        if (result.rowCount === 0) {
            return res.code(404).send({ error: 'Equipamento não encontrado.' })
        }

        removePhotos(photos.rows.map((row) => row.file_name))
        res.code(200).send({ success: 'Equipamento excluído.' })
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao excluir equipamento.' })
    }
}

export async function equipmentRoutes(fastify: FastifyInstance) {
    fastify.get('/api/equipment', { preHandler: [authenticate] }, getEquipment)
    fastify.post<{ Body: EquipmentBody }>('/api/equipment', { preHandler: [authenticate, checkAdmin] }, postEquipment)
    fastify.put<{ Params: IdParams; Body: EquipmentBody }>('/api/equipment/:id', { preHandler: [authenticate, checkAdmin] }, putEquipment)
    fastify.delete<{ Params: IdParams }>('/api/equipment/:id', { preHandler: [authenticate, checkAdmin] }, deleteEquipment)
}
