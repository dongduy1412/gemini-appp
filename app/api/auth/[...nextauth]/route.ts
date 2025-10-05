import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// ✅ Dùng authOptions từ lib/auth.ts (không duplicate nữa)
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }