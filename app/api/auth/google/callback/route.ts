import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge'

interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
  refresh_token?: string
}

interface GoogleUser {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const cookieStore = await cookies()
    const storedState = cookieStore.get('oauth_state')?.value
    console.log('Callback received:', { code: !!code, state, storedState })
    
    if (!code) {
      console.error('No code provided')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }
    
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { state, storedState })
      console.warn('⚠️ Skipping state validation for dev')
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    })
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url))
    }
    
    const tokens = await tokenResponse.json() as TokenResponse
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    
    const googleUser = await userResponse.json() as GoogleUser
    
    // Create session cookie
    const sessionData = {
      userId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.picture
    }
    const cookieStore2 = await cookies()
    cookieStore2.set('auth_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })
    
    cookieStore2.delete('oauth_state')

    
    console.log('✅ User logged in:', googleUser.email)
    
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }
}