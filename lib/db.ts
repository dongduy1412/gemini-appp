import { sql } from '@vercel/postgres'
import { Generation, RateLimit } from '@/types'

/**
 * ✅ KHÔNG CẦN getDB() nữa
 * @vercel/postgres tự động kết nối qua environment variables
 */

// ==================== USER FUNCTIONS ====================

export async function createOrUpdateUser(userData: {
  googleId: string
  email: string
  name?: string
  image?: string
}): Promise<string> {
  try {
    // Check if user exists
    const { rows: existing } = await sql`
      SELECT id FROM users WHERE google_id = ${userData.googleId}
    `

    if (existing.length > 0) {
      // Update existing user
      await sql`
        UPDATE users 
        SET email = ${userData.email}, 
            name = ${userData.name || null}, 
            image = ${userData.image || null}
        WHERE google_id = ${userData.googleId}
      `
      console.log('✅ Updated user:', existing[0].id)
      return existing[0].id
    }

    // Create new user
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO users (id, google_id, email, name, image)
      VALUES (${id}, ${userData.googleId}, ${userData.email}, ${userData.name || null}, ${userData.image || null})
    `
    console.log('✅ Created new user:', id)
    return id
  } catch (error) {
    console.error('❌ Error in createOrUpdateUser:', error)
    throw error
  }
}

// ==================== GENERATION FUNCTIONS ====================

export async function saveGeneration(
  generation: Omit<Generation, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO generations (id, user_id, transform_type, input_images, output_image, prompt_used)
      VALUES (
        ${id}, 
        ${generation.userId}, 
        ${generation.transformType}, 
        ${JSON.stringify(generation.inputImages)}, 
        ${generation.outputImage}, 
        ${generation.promptUsed || null}
      )
    `

    console.log('✅ Saved generation:', id)
    return id
  } catch (error) {
    console.error('❌ Error saving generation:', error)
    throw error
  }
}

export async function getUserGenerations(
  userId: string,
  limit: number = 20
): Promise<Generation[]> {
  try {
    const { rows } = await sql`
      SELECT * FROM generations 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      transformType: row.transform_type,
      inputImages: JSON.parse(row.input_images),
      outputImage: row.output_image,
      promptUsed: row.prompt_used,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error('❌ Error fetching generations:', error)
    return []
  }
}

export async function deleteUserGenerations(userId: string): Promise<void> {
  try {
    await sql`DELETE FROM generations WHERE user_id = ${userId}`
    console.log('✅ Deleted generations for user:', userId)
  } catch (error) {
    console.error('❌ Error deleting generations:', error)
    throw error
  }
}

// ==================== RATE LIMIT FUNCTIONS ====================

export async function checkAndUpdateRateLimit(
  userId: string
): Promise<{ allowed: boolean; rateLimit: RateLimit }> {
  const MAX_REQUESTS_PER_HOUR = 5
  const now = new Date()

  try {
    // Get existing rate limit
    const { rows: existing } = await sql`
      SELECT * FROM rate_limits WHERE user_id = ${userId}
    `

    // No record - create new
    if (existing.length === 0) {
      const resetAt = new Date(now.getTime() + 60 * 60 * 1000)
      
      await sql`
        INSERT INTO rate_limits (user_id, count, reset_at)
        VALUES (${userId}, 1, ${resetAt.toISOString()})
      `

      console.log(`✅ Rate limit created: ${userId} - 1/${MAX_REQUESTS_PER_HOUR}`)
      
      return {
        allowed: true,
        rateLimit: {
          userId,
          count: 1,
          resetAt: resetAt.toISOString(),
          remaining: MAX_REQUESTS_PER_HOUR - 1,
        },
      }
    }

    const record = existing[0]
    const resetAt = new Date(record.reset_at)

    // Reset period passed
    if (now > resetAt) {
      const newResetAt = new Date(now.getTime() + 60 * 60 * 1000)
      
      await sql`
        UPDATE rate_limits 
        SET count = 1, reset_at = ${newResetAt.toISOString()}
        WHERE user_id = ${userId}
      `

      console.log(`✅ Rate limit reset: ${userId} - 1/${MAX_REQUESTS_PER_HOUR}`)
      
      return {
        allowed: true,
        rateLimit: {
          userId,
          count: 1,
          resetAt: newResetAt.toISOString(),
          remaining: MAX_REQUESTS_PER_HOUR - 1,
        },
      }
    }

    // Rate limit exceeded
    if (record.count >= MAX_REQUESTS_PER_HOUR) {
      console.log(`❌ Rate limit exceeded: ${userId} - ${record.count}/${MAX_REQUESTS_PER_HOUR}`)
      
      return {
        allowed: false,
        rateLimit: {
          userId,
          count: record.count,
          resetAt: record.reset_at,
          remaining: 0,
        },
      }
    }

    // Increment counter
    const newCount = record.count + 1
    
    await sql`
      UPDATE rate_limits 
      SET count = ${newCount}
      WHERE user_id = ${userId}
    `

    console.log(`✅ Rate limit updated: ${userId} - ${newCount}/${MAX_REQUESTS_PER_HOUR}`)

    return {
      allowed: true,
      rateLimit: {
        userId,
        count: newCount,
        resetAt: record.reset_at,
        remaining: MAX_REQUESTS_PER_HOUR - newCount,
      },
    }
  } catch (error) {
    console.error('❌ Error checking rate limit:', error)
    throw error
  }
}