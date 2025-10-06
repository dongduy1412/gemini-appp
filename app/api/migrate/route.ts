import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
    
    return NextResponse.json({ success: true, message: 'Tables created' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}