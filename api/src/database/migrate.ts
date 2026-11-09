// Aplica, em ordem, os arquivos .sql de ./migrations que ainda não rodaram neste banco.
// Cada arquivo roda uma vez só: o nome dele fica anotado em manutencao.schema_migrations.
// Para mudar o banco, crie um arquivo NOVO (ex.: 002_adiciona_coluna.sql) — nunca edite um que já rodou.
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations')

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('Defina DIRECT_URL (ou DATABASE_URL) no .env.')
}

const client = new pg.Client({ connectionString })

await client.connect()

try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS manutencao`)
    await client.query(`
        CREATE TABLE IF NOT EXISTS manutencao.schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)

    const appliedResult = await client.query(`SELECT name FROM manutencao.schema_migrations`)
    const applied = new Set(appliedResult.rows.map((row) => row.name))

    const pending = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith('.sql') && !applied.has(file))
        .sort()

    if (pending.length === 0) {
        console.log('Nenhuma migration pendente.')
    }

    for (const file of pending) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')

        await client.query('BEGIN')

        try {
            await client.query(sql)
            await client.query(`INSERT INTO manutencao.schema_migrations (name) VALUES ($1)`, [file])
            await client.query('COMMIT')
            console.log(`Migration aplicada: ${file}`)
        } catch (error) {
            await client.query('ROLLBACK')
            throw new Error(`Falha na migration ${file}: ${(error as Error).message}`)
        }
    }
} finally {
    await client.end()
}
