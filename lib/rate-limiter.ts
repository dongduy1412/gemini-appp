import { RateLimit } from '@/types'

const MAX_REQUESTS_PER_HOUR = 5

type D1Database = any

export async function checkAndUpdateRateLimit(
  db: D1Database,
  userId: string
): Promise<{ allowed: boolean; rateLimit: RateLimit }> {
  const now = new Date()

  const existing = await db
    .prepare('SELECT * FROM rate_limits WHERE user_id = ?')
    .bind(userId)
    .first()

  if (!existing) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000)

    await db
      .prepare(
        'INSERT INTO rate_limits (user_id, count, reset_at) VALUES (?, ?, ?)'
      )
      .bind(userId, 1, resetAt.toISOString())
      .run()

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

  if (now > resetAt) {
    const newResetAt = new Date(now.getTime() + 60 * 60 * 1000)

    await db
      .prepare('UPDATE rate_limits SET count = ?, reset_at = ? WHERE user_id = ?')
      .bind(1, newResetAt.toISOString(), userId)
      .run()

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

  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
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

  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE user_id = ?')
    .bind(userId)
    .run()

  return {
    allowed: true,
    rateLimit: {
      userId,
      count: existing.count + 1,
      resetAt: existing.reset_at,
      remaining: MAX_REQUESTS_PER_HOUR - (existing.count + 1),
    },
  }
}