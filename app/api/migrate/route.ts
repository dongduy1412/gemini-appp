import { createClient } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Disable prerendering
export const dynamic = 'force-dynamic'

export async function GET() {
  const client = createClient()
  
  try {
    await client.connect()
    
    await client.sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    
    await client.sql`CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      transform_type TEXT NOT NULL,
      input_images TEXT NOT NULL,
      output_image TEXT NOT NULL,
      prompt_used TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    
    await client.sql`CREATE TABLE IF NOT EXISTS rate_limits (
      user_id TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      reset_at TIMESTAMP NOT NULL
    )`
    
    const result = await client.sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    await client.end()
    
    return NextResponse.json({ 
      success: true, 
      tables: result.rows 
    })
  } catch (error: any) {
    try { await client.end() } catch {}
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}