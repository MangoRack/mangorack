import "./env"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

// In-memory login rate limiter: 5 attempts per minute per email
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_MAX = 5
const LOGIN_WINDOW_MS = 60_000

function isLoginRateLimited(email: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(email)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > LOGIN_MAX
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(key)
  }
}, 60_000).unref?.()

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        if (isLoginRateLimited(email)) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
