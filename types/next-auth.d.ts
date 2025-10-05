import 'next-auth'

declare module 'next-auth' {
  /**
   * Extend Session to include user.id
   */
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  /**
   * Extend User to include id
   */
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend JWT to include user id in sub
   */
  interface JWT {
    sub?: string
  }
}