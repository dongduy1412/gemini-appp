import { sql } from '@vercel/postgres'
import { RateLimit } from '@/types'

const MAX_REQUESTS_PER_HOUR = 5

/**
 * Check and update rate limit for a user
 */
export async function checkAndUpdateRateLimit(
  userId: string
): Promise<{ allowed: boolean; rateLimit: RateLimit }> {
  const now = new Date()

  // Get existing rate limit record
  const existing = await sql`
    SELECT * FROM rate_limits WHERE user_id = ${userId}
  `

  // No existing record - create new one
  if (existing.rows.length === 0) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

    await sql`
      INSERT INTO rate_limits (user_id, count, reset_at)
      VALUES (${userId}, 1, ${resetAt.toISOString()})
    `

    console.log(`✅ Rate limit created for user ${userId}: 1/${MAX_REQUESTS_PER_HOUR}`)

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

  const record = existing.rows[0]
  const resetAt = new Date(record.reset_at)

  // Reset period has passed - reset counter
  if (now > resetAt) {
    const newResetAt = new Date(now.getTime() + 60 * 60 * 1000)

    await sql`
      UPDATE rate_limits 
      SET count = 1, reset_at = ${newResetAt.toISOString()}
      WHERE user_id = ${userId}
    `

    console.log(`✅ Rate limit reset for user ${userId}: 1/${MAX_REQUESTS_PER_HOUR}`)

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
    console.log(`❌ Rate limit exceeded for user ${userId}: ${record.count}/${MAX_REQUESTS_PER_HOUR}`)
    
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

  console.log(`✅ Rate limit updated for user ${userId}: ${newCount}/${MAX_REQUESTS_PER_HOUR}`)

  return {
    allowed: true,
    rateLimit: {
      userId,
      count: newCount,
      resetAt: record.reset_at,
      remaining: MAX_REQUESTS_PER_HOUR - newCount,
    },
  }
}