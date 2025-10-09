import { Lucia } from "lucia"
import { D1Adapter } from "@lucia-auth/adapter-sqlite"
import { cookies } from "next/headers"
import { cache } from "react"

export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: "users",
    session: "sessions"
  })

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === "production"
      }
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        name: attributes.name,
        image: attributes.image
      }
    }
  })
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>
    DatabaseUserAttributes: {
      email: string
      name: string
      image: string
    }
  }
}

export const validateRequest = cache(async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")?.value
  
  if (!sessionCookie) {
    return { user: null, session: null }
  }

  try {
    const sessionData = JSON.parse(sessionCookie)
    
    return {
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        image: sessionData.image
      },
      session: { id: 'temp-session' }
    }
  } catch {
    return { user: null, session: null }
  }
})