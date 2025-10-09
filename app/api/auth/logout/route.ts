import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function POST() {
  cookieStore.delete('oauth_state')
  return NextResponse.json({ success: true })
}