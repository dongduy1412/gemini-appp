import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { saveGeneration, checkAndUpdateRateLimit } from '@/lib/db'

export const runtime = 'nodejs'

const hasRealApiKey = process.env.GEMINI_API_KEY && 
                      process.env.GEMINI_API_KEY !== 'test' &&
                      process.env.GEMINI_API_KEY.length > 20

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ LẤY DATA TỪ REQUEST
    const body = await request.json()
    const { transformType, images } = body

    console.log('🎯 Request:', { transformType, imageCount: images?.length, userId: session.user.id })

    if (!transformType || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Transform type and images are required' },
        { status: 400 }
      )
    }

    // ✅ RATE LIMITING
    const { allowed, rateLimit } = await checkAndUpdateRateLimit(session.user.id)
    
    if (!allowed) {
      const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString()
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can generate ${rateLimit.remaining} more images. Try again after ${resetTime}`,
          rateLimit 
        },
        { status: 429 }
      )
    }

    // Demo mode - chỉ dùng cho development
    if (!hasRealApiKey && process.env.NODE_ENV === 'development') {
      console.log('🔧 DEMO MODE (Development only)')
      const base64Image = images[0].replace(/^data:image\/\w+;base64,/, '')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Lưu vào database ngay cả trong demo mode
      await saveGeneration({
        userId: session.user.id,
        transformType,
        inputImages: images,
        outputImage: base64Image,
        promptUsed: 'Demo mode'
      })
      
      return NextResponse.json({
        success: true,
        outputImage: base64Image,
        message: 'Demo mode',
        rateLimit
      })
    }

    if (!hasRealApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    console.log('🚀 PRODUCTION MODE: Calling Gemini API')

    const prompts = {
      headshot: 'Edit this image: Create a professional corporate headshot. Transform the person to wear business professional attire, add studio lighting, clean solid color background, professional hair and makeup. Generate a polished professional portrait suitable for LinkedIn or corporate use.',
      
      outfit: 'Edit this image: Change the clothing and outfit of this person. Replace their current clothes with modern, stylish, fashionable attire. Keep the person same but generate completely different outfit - maybe casual chic, business casual, or trendy streetwear. Transform their clothing style.',
      
      interior: 'Edit this image: Place the furniture or object from the first image into the room shown in the second image. Match the scale and proportions appropriately, align perspective correctly with the room, match lighting conditions. Ensure the object fits naturally in the space.',
      
      background: 'Edit this image: Replace the background of this image while keeping the main subject intact. Cleanly separate the subject from the background, maintain natural edge transitions and lighting. Make the composite look seamless and realistic.',
    }

    const prompt = prompts[transformType as keyof typeof prompts] || prompts.headshot

    const imageParts = images.map((img: string) => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, '')
      const mimeType = img.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png'
      return { inlineData: { mimeType, data: base64Data } }
    })

    const requestData = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }, ...imageParts]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', data)
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Gemini API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      throw new Error(data.error?.message || `API Error: ${response.status}`)
    }

    if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      
      const imageResult = parts.find((part: any) => part.inlineData?.data)
      
      if (imageResult) {
        console.log('✅ Found image in response')
        
        // ✅ LƯU VÀO DATABASE
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
      }
      
      const textResult = parts.find((part: any) => part.text)
      if (textResult) {
        console.log('⚠️ Model returned text:', textResult.text)
        return NextResponse.json({
          success: false,
          error: `Model returned text instead of image. Try again with different images.`
        }, { status: 400 })
      }
    }

    console.error('❌ No valid data in response')
    throw new Error('Model did not return an image')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}