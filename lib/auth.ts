import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createOrUpdateUser } from './db-postgres'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',  // 🔥 quan trọng
        secure: process.env.NODE_ENV === 'production', // 🔥 bắt buộc khi dùng none
        path: '/',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',  // 🔥
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'none',  // 🔥
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
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
      if (token?.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
