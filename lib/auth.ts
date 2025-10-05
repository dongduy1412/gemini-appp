import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createOrUpdateUser } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          // ✅ BỎ getDB(), gọi trực tiếp
          const userId = await createOrUpdateUser({
            googleId: account.providerAccountId,
            email: profile.email,
            name: user.name || undefined,
            image: user.image || undefined,
          })
          
          user.id = userId
          return true
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}