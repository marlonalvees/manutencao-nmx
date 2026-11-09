// Gera um token de teste assinado com o JWT_SECRET do .env, no mesmo formato do token do hub.
//   npm run dev:token -- --admin --user=1
// O --user precisa ser um id que exista em public.users.
import 'dotenv/config'
import jwt from 'jsonwebtoken'

const admin = process.argv.includes('--admin')
const userId = Number(process.argv.find((arg) => arg.startsWith('--user='))?.split('=')[1] ?? 1)

if (!process.env.JWT_SECRET) {
    throw new Error('Defina JWT_SECRET no .env antes de gerar um token de dev.')
}

const payload = {
    sub: userId,
    role: 'user',
    permissions: [{ module: 'manutencao', access: admin ? 'admin' : 'read' }],
    branchs: []
}

console.log(jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }))
