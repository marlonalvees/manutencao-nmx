import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { db } from '../database/database.ts'
import { authenticate, checkAdmin } from '../middlewares/auth.middlewares.ts'
import { PHOTO_EXTENSIONS, UPLOADS_DIR, removePhotos, uploadErrorMessage } from '../lib/uploads.ts'
import { isDate, today, trimOrNull } from '../lib/validation.ts'

type IdParams = {
    id: string
}

type ListQuery = {
    equipment_id?: string
}

async function getMaintenances(req: FastifyRequest<{ Querystring: ListQuery }>, res: FastifyReply) {
    const equipmentId = Number(req.query.equipment_id) || null

    try {
        const result = await db.query(`
            SELECT m.id, m.equipment_id, e.name AS equipment_name, e.type AS equipment_type, b.name AS branch_name,
                   m.scheduled_date, m.done_date, m.notes, m.created_at, u.name AS done_by_name,
                   COALESCE(json_agg(p.file_name ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL), '[]') AS photos
            FROM manutencao.maintenance AS m
            JOIN manutencao.equipment AS e ON e.id = m.equipment_id
            LEFT JOIN public.branchs AS b ON b.id = e.branch_id
            LEFT JOIN public.users AS u ON u.id = m.done_by
            LEFT JOIN manutencao.maintenance_photo AS p ON p.maintenance_id = m.id
            WHERE ($1::int IS NULL OR m.equipment_id = $1)
            GROUP BY m.id, e.id, b.name, u.name
            ORDER BY m.done_date DESC, m.id DESC
            LIMIT 200
        `, [equipmentId])

        res.code(200).send(result.rows)
    } catch (error) {
        console.error(error)
        res.code(500).send({ error: 'Erro ao buscar manutenções.' })
    }
}

// Recebe um multipart/form-data: done_date, notes e até 5 arquivos no campo "photos".
async function postMaintenance(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const equipmentId = Number(req.params.id)
    const fields: Record<string, string> = {}
    const saved: string[] = []
    let uploadError = ''

    try {
        for await (const part of req.parts()) {
            if (part.type === 'field') {
                fields[part.fieldname] = String(part.value)
                continue
            }

            const extension = PHOTO_EXTENSIONS[part.mimetype]

            if (!extension || uploadError) {
                uploadError ||= 'Formato de foto não suportado. Use JPEG, PNG ou WEBP.'
                part.file.resume()
                continue
            }

            const fileName = `${randomUUID()}${extension}`
            saved.push(fileName)
            await pipeline(part.file, fs.createWriteStream(path.join(UPLOADS_DIR, fileName)))
        }
    } catch (error) {
        uploadError = uploadErrorMessage(error)
    }

    const doneDate = fields.done_date

    if (!uploadError && !isDate(doneDate)) uploadError = 'Informe a data em que a manutenção foi feita.'
    if (!uploadError && doneDate > today()) uploadError = 'A data da manutenção não pode ser no futuro.'

    if (uploadError) {
        removePhotos(saved)
        return res.code(400).send({ error: uploadError })
    }

    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const equipment = await client.query(`
            SELECT next_date FROM manutencao.equipment WHERE id = $1 FOR UPDATE
        `, [equipmentId])

        if (equipment.rows.length === 0) {
            await client.query('ROLLBACK')
            removePhotos(saved)
            return res.code(404).send({ error: 'Equipamento não encontrado.' })
        }

        const inserted = await client.query(`
            INSERT INTO manutencao.maintenance
            (equipment_id, scheduled_date, done_date, notes, done_by)
            VALUES
            ($1, $2, $3, $4, $5)
            RETURNING id
        `, [equipmentId, equipment.rows[0].next_date, doneDate, trimOrNull(fields.notes), req.user.sub])

        for (const fileName of saved) {
            await client.query(`
                INSERT INTO manutencao.maintenance_photo (maintenance_id, file_name) VALUES ($1, $2)
            `, [inserted.rows[0].id, fileName])
        }

        // a próxima conta a partir do dia em que foi feita, não do dia que estava previsto
        const updated = await client.query(`
            UPDATE manutencao.equipment
            SET next_date = $1::date + interval_days
            WHERE id = $2
            RETURNING next_date
        `, [doneDate, equipmentId])

        await client.query('COMMIT')

        res.code(201).send({ success: 'Manutenção registrada.', next_date: updated.rows[0].next_date })
    } catch (error) {
        await client.query('ROLLBACK')
        removePhotos(saved)
        console.error(error)
        res.code(500).send({ error: 'Erro ao registrar manutenção.' })
    } finally {
        client.release()
    }
}

// Desfaz uma confirmação feita por engano. Se era a mais recente do equipamento,
// a próxima data volta a ser a que estava prevista antes dela.
async function deleteMaintenance(req: FastifyRequest<{ Params: IdParams }>, res: FastifyReply) {
    const id = Number(req.params.id)
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const found = await client.query(`
            SELECT m.equipment_id, m.scheduled_date,
                   m.id = (
                       SELECT latest.id FROM manutencao.maintenance AS latest
                       WHERE latest.equipment_id = m.equipment_id
                       ORDER BY latest.id DESC
                       LIMIT 1
                   ) AS is_latest
            FROM manutencao.maintenance AS m
            WHERE m.id = $1
        `, [id])

        if (found.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.code(404).send({ error: 'Manutenção não encontrada.' })
        }

        const photos = await client.query(`
            SELECT file_name FROM manutencao.maintenance_photo WHERE maintenance_id = $1
        `, [id])

        await client.query(`DELETE FROM manutencao.maintenance WHERE id = $1`, [id])

        if (found.rows[0].is_latest) {
            await client.query(`
                UPDATE manutencao.equipment SET next_date = $1 WHERE id = $2
            `, [found.rows[0].scheduled_date, found.rows[0].equipment_id])
        }

        await client.query('COMMIT')

        removePhotos(photos.rows.map((row) => row.file_name))
        res.code(200).send({ success: 'Manutenção excluída.' })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error(error)
        res.code(500).send({ error: 'Erro ao excluir manutenção.' })
    } finally {
        client.release()
    }
}

export async function maintenanceRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: ListQuery }>('/api/maintenances', { preHandler: [authenticate] }, getMaintenances)
    fastify.post<{ Params: IdParams }>('/api/equipment/:id/maintenances', { preHandler: [authenticate] }, postMaintenance)
    fastify.delete<{ Params: IdParams }>('/api/maintenances/:id', { preHandler: [authenticate, checkAdmin] }, deleteMaintenance)
}
