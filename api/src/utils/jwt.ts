import jwt from 'jsonwebtoken'

// O token é emitido pelo hub no login; aqui só conferimos a assinatura com o mesmo JWT_SECRET.
export type AuthUser = {
    sub: number
    role: string
    permissions: { module: string; access: string }[]
    branchs: { id: number; name: string }[]
}

export function verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET as string) as unknown as AuthUser
}
