import { SignJWT, jwtVerify } from 'jose'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const secret = new TextEncoder().encode(jwtSecret)

export interface JWTPayload {
  userId: string
  email: string
  systemRole: 'admin' | 'manager' | 'user'
}

export async function signToken(payload: JWTPayload): Promise<string> {
  try {
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)
  } catch (error) {
    console.error('[v0] Token signing failed:', error)
    throw error
  }
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('[v0] Token verification failed:', error)
    throw error
  }
}
