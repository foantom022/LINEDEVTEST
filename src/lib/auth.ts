import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email, Phone, or LINE ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { identifier, password } = credentialsSchema.parse(credentials)

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: identifier },
                { phoneNumber: identifier },
                { lineId: identifier },
              ],
            },
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          // Update online status
          await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true, lastSeen: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.profileImage,
            lineId: user.lineId,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.lineId = (user as any).lineId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.lineId = token.lineId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})
