import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { signToken } from '@/lib/auth/jwt'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const { email, password } = parsed.data

    await connectDB()

    // ─── Master Credential Check ─────────────────────────────────────────────
    const masterEmail = process.env.MASTER_EMAIL
    const masterPassword = process.env.MASTER_PASSWORD

    if (masterEmail && email.toLowerCase() === masterEmail.toLowerCase() && password === masterPassword) {
      let masterUser = await User.findOne({ email: masterEmail.toLowerCase() })
      
      if (!masterUser) {
        // Create master user on the fly if it doesn't exist
        const hashedPassword = await bcrypt.hash(masterPassword, 10)
        masterUser = await User.create({
          email: masterEmail.toLowerCase(),
          hashedPassword,
          firstName: 'Master',
          lastName: 'Admin',
          systemRole: 'admin',
          isActive: true,
        })
      }

      const token = await signToken({
        userId: masterUser._id.toString(),
        email: masterUser.email,
        systemRole: 'admin',
      })

      const res = NextResponse.json({
        user: {
          id: masterUser._id.toString(),
          email: masterUser.email,
          firstName: masterUser.firstName,
          lastName: masterUser.lastName,
          systemRole: 'admin',
          isActive: true,
          notifications: masterUser.notifications,
          appearance: masterUser.appearance,
        },
      })

      res.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return res
    }

    // ─── Standard User Login ─────────────────────────────────────────────────
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.hashedPassword)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Block deactivated users
    if (user.isActive === false) {
      return NextResponse.json({ error: 'Your account has been deactivated. Please contact an admin.' }, { status: 403 })
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      systemRole: user.systemRole ?? 'user',
    })

    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company,
        role: user.role,
        systemRole: user.systemRole ?? 'user',
        location: user.location,
        bio: user.bio,
        notifications: user.notifications,
        appearance: user.appearance,
      },
    })

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
