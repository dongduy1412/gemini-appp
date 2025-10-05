import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { saveGeneration, checkAndUpdateRateLimit } from '@/lib/db'

export const runtime = 'nodejs' // ✅ Important!

// ... giữ nguyên phần còn lại ...

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ BỎ getDB()
    const { allowed, rateLimit } = await checkAndUpdateRateLimit(session.user.id)
    
    if (!allowed) {
      const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString()
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Try again after ${resetTime}`,
          rateLimit 
        },
        { status: 429 }
      )
    }

    // ... code generate image ...

    // ✅ Lưu vào DB (BỎ tham số db)
    await saveGeneration({
      userId: session.user.id,
      transformType,
      inputImages: images,
      outputImage: imageResult.inlineData.data,
      promptUsed: prompt
    })
    
    return NextResponse.json({
      success: true,
      outputImage: imageResult.inlineData.data,
      rateLimit
    })
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}