import { Generation } from '@/types'

type D1Database = any

export async function getDB(): Promise<D1Database> {
  // @ts-ignore
  return globalThis.DB
}

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

  return id
}

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

export async function createOrUpdateUser(
  db: D1Database,
  userData: {
    googleId: string
    email: string
    name?: string
    image?: string
  }
): Promise<string> {
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE google_id = ?')
    .bind(userData.googleId)
    .first()

  if (existingUser) {
    return existingUser.id
  }

  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO users (id, google_id, email, name, image)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, userData.googleId, userData.email, userData.name, userData.image)
    .run()

  return id
}