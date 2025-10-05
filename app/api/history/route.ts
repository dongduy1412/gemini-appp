import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getUserGenerations } from '@/lib/db-postgres'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await getUserGenerations(session.user.id)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`DELETE FROM generations WHERE user_id = ${session.user.id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting history:', error)
    return NextResponse.json(
      { error: 'Failed to delete history' },
      { status: 500 }
    )
  }
}