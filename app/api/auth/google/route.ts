import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge' 

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    
    // Generate state for CSRF protection
    const state = crypto.randomUUID()
    
    // Build authorization URL theo chuẩn Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid email profile')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    
    // Save state to cookie
    const cookieStore2 = await cookies()
    cookieStore2.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })
    
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 })
  }
}