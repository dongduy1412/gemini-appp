import { Generation } from '@/types'

type D1Database = any

/**
 * Get D1 Database instance from Cloudflare binding
 * ✅ Works with edge runtime
 */
export async function getDB(): Promise<D1Database> {
  // @ts-ignore - Cloudflare D1 binding
  if (typeof DB !== 'undefined') {
    // @ts-ignore
    return DB
  }
  
  // For development/testing without D1
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ D1 not available, using mock database')
    return getMockDB()
  }
  
  throw new Error('D1 database not found. Make sure DB binding is configured in wrangler.toml')
}

/**
 * Save a new generation to database
 */
export async function saveGeneration(
  db: D1Database,
  generation: Omit<Generation, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO generations (id, user_id, transform_type, input_images, output_image, prompt_used)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      generation.userId,
      generation.transformType,
      JSON.stringify(generation.inputImages),
      generation.outputImage,
      generation.promptUsed || null
    )
    .run()

  console.log('✅ Saved generation to database:', id)
  return id
}

/**
 * Get user's generation history
 */
export async function getUserGenerations(
  db: D1Database,
  userId: string,
  limit: number = 20
): Promise<Generation[]> {
  const result = await db
    .prepare(
      `SELECT * FROM generations 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    )
    .bind(userId, limit)
    .all()

  if (!result.results) {
    return []
  }

  return result.results.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    transformType: row.transform_type,
    inputImages: JSON.parse(row.input_images),
    outputImage: row.output_image,
    promptUsed: row.prompt_used,
    createdAt: row.created_at,
  }))
}

/**
 * Create or update user in database
 */
export async function createOrUpdateUser(
  db: D1Database,
  userData: {
    googleId: string
    email: string
    name?: string
    image?: string
  }
): Promise<string> {
  // Check if user exists
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE google_id = ?')
    .bind(userData.googleId)
    .first()

  if (existingUser) {
    // Update existing user
    await db
      .prepare(
        `UPDATE users 
         SET email = ?, name = ?, image = ?
         WHERE google_id = ?`
      )
      .bind(userData.email, userData.name, userData.image, userData.googleId)
      .run()
    
    return existingUser.id
  }

  // Create new user
  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO users (id, google_id, email, name, image)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, userData.googleId, userData.email, userData.name, userData.image)
    .run()

  console.log('✅ Created new user:', id)
  return id
}

/**
 * Mock database for development (when D1 not available)
 */
function getMockDB() {
  const mockData: {
    users: any[]
    generations: any[]
    rateLimits: any[]
  } = {
    users: [],
    generations: [],
    rateLimits: []
  }

  return {
    prepare: (query: string) => ({
      bind: (...args: any[]) => ({
        run: async () => {
          console.log('Mock DB run:', query, args)
          return { success: true }
        },
        first: async () => {
          console.log('Mock DB first:', query, args)
          return null
        },
        all: async () => {
          console.log('Mock DB all:', query, args)
          return { results: [] }
        }
      })
    })
  }
}