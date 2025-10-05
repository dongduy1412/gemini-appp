import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const hasRealApiKey = process.env.GEMINI_API_KEY && 
                      process.env.GEMINI_API_KEY !== 'test' &&
                      process.env.GEMINI_API_KEY.length > 20

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transformType, images } = body

    console.log('🎯 Request:', { transformType, imageCount: images?.length })

    if (!transformType || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Transform type and images are required' },
        { status: 400 }
      )
    }

    if (!hasRealApiKey) {
      console.log('🔧 DEMO MODE')
      const base64Image = images[0].replace(/^data:image\/\w+;base64,/, '')
      await new Promise(resolve => setTimeout(resolve, 1500))
      return NextResponse.json({
        success: true,
        outputImage: base64Image,
        message: 'Demo mode'
      })
    }

    console.log('🚀 PRODUCTION MODE: Calling Gemini API')

    const prompts = {
      headshot: 'Edit this image: Create a professional corporate headshot. Transform the person to wear business professional attire, add studio lighting, clean solid color background, professional hair and makeup. Generate a polished professional portrait suitable for LinkedIn or corporate use.',
      
      product_photo: 'Edit this image: Transform into commercial product photography. Remove current background, add pure white seamless background, add professional studio lighting with soft shadows, center the product, enhance colors and details. Generate a professional e-commerce quality product photo.',
      
      background_removal: 'Edit this image: Completely remove and erase the background. Keep only the main subject/person/object in focus. Replace background with solid white color or make it transparent. Clean up edges perfectly.',
      
      style_transfer: 'Edit this image: Transform into artistic painting. Apply oil painting or watercolor artistic style, add artistic brush strokes and creative effects, enhance colors artistically. Generate an artistic version of this image.',
      
      outfit: 'Edit this image: Change the clothing and outfit of this person. Replace their current clothes with modern, stylish, fashionable attire. Keep the person same but generate completely different outfit - maybe casual chic, business casual, or trendy streetwear. Transform their clothing style.'
    }

    const prompt = prompts[transformType as keyof typeof prompts] || 'Transform this image'

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
    console.log('📦 Full API Response:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('❌ API Error:', data)
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API quota exceeded. Enable billing.' },
          { status: 429 }
        )
      }
      throw new Error(data.error?.message || `API Error: ${response.status}`)
    }

    if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      console.log('📝 Parts:', JSON.stringify(parts, null, 2))
      
      const imageResult = parts.find((part: any) => part.inlineData?.data)
      
      if (imageResult) {
        console.log('✅ Found image in response')
        return NextResponse.json({
          success: true,
          outputImage: imageResult.inlineData.data,
          rateLimit: { remaining: 10 }
        })
      }
      
      const textResult = parts.find((part: any) => part.text)
      if (textResult) {
        console.log('⚠️ Model returned text:', textResult.text)
        return NextResponse.json({
          success: false,
          error: `Model returned text: ${textResult.text.substring(0, 200)}`
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