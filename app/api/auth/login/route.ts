import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-oauth'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`
  const authUrl = getGoogleAuthUrl(redirectUri)
  
  // Lưu callbackUrl vào cookie để dùng sau
  const response = NextResponse.redirect(authUrl)
  response.cookies.set('oauth_callback', callbackUrl, {
    httpOnly: true,
    maxAge: 600, // 10 minutes
    path: '/'
  })
  
  return response
}
