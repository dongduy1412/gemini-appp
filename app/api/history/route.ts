import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Lấy history từ database
    // Tạm thời return empty array
    const history = []

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
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Xóa history từ database
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting history:', error)
    return NextResponse.json(
      { error: 'Failed to delete history' },
      { status: 500 }
    )
  }
}