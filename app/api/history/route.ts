import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/lucia'

export const runtime = 'edge'

interface Env {
  DB: D1Database
}

// GET - Lấy lịch sử
export async function GET(request: Request) {
  try {
    const { user } = await validateRequest()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get D1 database from context
    const env = process.env as any
    const DB = env.DB as D1Database

    if (!DB) {
      console.error('❌ D1 database not available')
      return NextResponse.json({ images: [] })
    }

    const result = await DB.prepare(
      'SELECT * FROM image_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(user.id).all()

    const images = result.results?.map((row: any) => ({
      id: row.id,
      transformType: row.transform_type,
      inputImages: JSON.parse(row.input_images),
      outputImage: row.output_image,
      createdAt: new Date(row.created_at * 1000).toISOString()
    })) || []

    console.log('✅ Loaded history from D1:', images.length)

    return NextResponse.json({ images })
  } catch (error: any) {
    console.error('❌ Error loading history:', error)
    return NextResponse.json({ images: [], error: error.message }, { status: 500 })
  }
}

// POST - Lưu lịch sử mới
export async function POST(request: Request) {
  try {
    const { user } = await validateRequest()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transformType, inputImages, outputImage } = body

    if (!transformType || !inputImages || !outputImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get D1 database from context
    const env = process.env as any
    const DB = env.DB as D1Database

    if (!DB) {
      console.error('❌ D1 database not available')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const id = Date.now().toString()
    const createdAt = Math.floor(Date.now() / 1000)

    await DB.prepare(
      'INSERT INTO image_history (id, user_id, transform_type, input_images, output_image, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      user.id,
      transformType,
      JSON.stringify(inputImages),
      outputImage,
      createdAt
    ).run()

    console.log('✅ Saved to D1:', id)

    return NextResponse.json({ 
      success: true,
      id,
      message: 'History saved successfully' 
    })
  } catch (error: any) {
    console.error('❌ Error saving history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save history' },
      { status: 500 }
    )
  }
}