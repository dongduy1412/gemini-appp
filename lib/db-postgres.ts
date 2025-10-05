import { sql } from '@vercel/postgres'
import { Generation } from '@/types'

/**
 * Save a new generation to database
 */
export async function saveGeneration(
  generation: Omit<Generation, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID()

  await sql`
    INSERT INTO generations (id, user_id, transform_type, input_images, output_image, prompt_used)
    VALUES (${id}, ${generation.userId}, ${generation.transformType}, 
            ${JSON.stringify(generation.inputImages)}, ${generation.outputImage}, 
            ${generation.promptUsed || null})
  `

  console.log('✅ Saved generation to database:', id)
  return id
}

/**
 * Get user's generation history
 */
export async function getUserGenerations(
  userId: string,
  limit: number = 20
): Promise<Generation[]> {
  const result = await sql`
    SELECT * FROM generations 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `

  return result.rows.map((row: any) => ({
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
export async function createOrUpdateUser(userData: {
  googleId: string
  email: string
  name?: string
  image?: string
}): Promise<string> {
  // Check if user exists
  const existing = await sql`
    SELECT id FROM users WHERE google_id = ${userData.googleId}
  `

  if (existing.rows.length > 0) {
    // Update existing user
    await sql`
      UPDATE users 
      SET email = ${userData.email}, 
          name = ${userData.name || null}, 
          image = ${userData.image || null}
      WHERE google_id = ${userData.googleId}
    `
    return existing.rows[0].id
  }

  // Create new user
  const id = crypto.randomUUID()

  await sql`
    INSERT INTO users (id, google_id, email, name, image)
    VALUES (${id}, ${userData.googleId}, ${userData.email}, 
            ${userData.name || null}, ${userData.image || null})
  `

  console.log('✅ Created new user:', id)
  return id
}