import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/lucia'

export const runtime = 'edge'

export async function GET() {
  const { user } = await validateRequest()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}