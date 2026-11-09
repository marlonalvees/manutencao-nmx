import pg from 'pg'

// Colunas DATE chegam como texto ("2026-11-09"). Sem isso o pg converte para Date no fuso do
// servidor e, ao virar JSON, a data pode "voltar" um dia.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value)

export const db = new pg.Pool({
    connectionString: process.env.DATABASE_URL
})
