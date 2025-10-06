import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dynamic import để tránh lỗi build
    const { sql } = await import('@vercel/postgres')
    
    // Check connection
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ 
        error: 'POSTGRES_URL not found',
        env: Object.keys(process.env).filter(k => k.includes('POSTGRES'))
      }, { status: 500 })
    }
    
    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    
    await sql`CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      transform_type TEXT NOT NULL,
      input_images TEXT NOT NULL,
      output_image TEXT NOT NULL,
      prompt_used TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    
    await sql`CREATE TABLE IF NOT EXISTS rate_limits (
      user_id TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      reset_at TIMESTAMP NOT NULL
    )`
    
    // Verify tables created
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    return NextResponse.json({ 
      success: true, 
      tables: tables.rows.map(r => r.table_name)
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 })
  }
}