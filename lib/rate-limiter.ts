import { RateLimit } from '@/types'

const MAX_REQUESTS_PER_HOUR = 5

type D1Database = any

/**
 * Check and update rate limit for a user
 * Returns whether the request is allowed and current rate limit info
 */
export async function checkAndUpdateRateLimit(
  db: D1Database,
  userId: string
): Promise<{ allowed: boolean; rateLimit: RateLimit }> {
  const now = new Date()

  // Get existing rate limit record
  const existing = await db
    .prepare('SELECT * FROM rate_limits WHERE user_id = ?')
    .bind(userId)
    .first()

  // No existing record - create new one
  if (!existing) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

    await db
      .prepare(
        'INSERT INTO rate_limits (user_id, count, reset_at) VALUES (?, ?, ?)'
      )
      .bind(userId, 1, resetAt.toISOString())
      .run()

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

  const resetAt = new Date(existing.reset_at)

  // Reset period has passed - reset counter
  if (now > resetAt) {
    const newResetAt = new Date(now.getTime() + 60 * 60 * 1000)

    await db
      .prepare('UPDATE rate_limits SET count = ?, reset_at = ? WHERE user_id = ?')
      .bind(1, newResetAt.toISOString(), userId)
      .run()

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
  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
    console.log(`❌ Rate limit exceeded for user ${userId}: ${existing.count}/${MAX_REQUESTS_PER_HOUR}`)
    
    return {
      allowed: false,
      rateLimit: {
        userId,
        count: existing.count,
        resetAt: existing.reset_at,
        remaining: 0,
      },
    }
  }

  // Increment counter
  const newCount = existing.count + 1
  
  await db
    .prepare('UPDATE rate_limits SET count = ? WHERE user_id = ?')
    .bind(newCount, userId)
    .run()

  console.log(`✅ Rate limit updated for user ${userId}: ${newCount}/${MAX_REQUESTS_PER_HOUR}`)

  return {
    allowed: true,
    rateLimit: {
      userId,
      count: newCount,
      resetAt: existing.reset_at,
      remaining: MAX_REQUESTS_PER_HOUR - newCount,
    },
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimit(
  db: D1Database,
  userId: string
): Promise<RateLimit | null> {
  const existing = await db
    .prepare('SELECT * FROM rate_limits WHERE user_id = ?')
    .bind(userId)
    .first()

  if (!existing) {
    return null
  }

  const now = new Date()
  const resetAt = new Date(existing.reset_at)

  // Rate limit expired
  if (now > resetAt) {
    return {
      userId,
      count: 0,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      remaining: MAX_REQUESTS_PER_HOUR,
    }
  }

  return {
    userId,
    count: existing.count,
    resetAt: existing.reset_at,
    remaining: Math.max(0, MAX_REQUESTS_PER_HOUR - existing.count),
  }
}