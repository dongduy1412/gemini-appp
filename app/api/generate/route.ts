import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/lucia'
import { GoogleGenerativeAI } from '@google/generative-ai'
// Remove: import { getCloudflareContext } from '@opennextjs/cloudflare'
import { generateId } from 'lucia'

export const runtime = 'edge'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GenerateRequest {
  transformType: string
  images: string[]
}

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as GenerateRequest
    const { transformType, images } = body
    
    if (!transformType || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview' 
    })
    
    const prompt = getPromptForTransformType(transformType)
    
    const imageParts = images.map((img: string) => {
      const base64Data = img.includes('base64,') 
        ? img.split('base64,')[1] 
        : img
      
      let mimeType = 'image/jpeg'
      if (img.includes('image/png')) {
        mimeType = 'image/png'
      } else if (img.includes('image/webp')) {
        mimeType = 'image/webp'
      }
      
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      }
    })

    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const candidates = response.candidates
    
    let outputImage = ''
    
    if (candidates && candidates[0]) {
      const parts = candidates[0].content.parts
      
      for (const part of parts) {
        if (part.inlineData) {
          const imageBase64 = part.inlineData.data
          outputImage = `data:image/png;base64,${imageBase64}`
          break
        }
      }
    }
    
    if (!outputImage) {
      outputImage = response.text()
    }

    // TODO: Save to D1 after deploy
    // Will be implemented with Cloudflare bindings at runtime
    
    return NextResponse.json({ result: outputImage })
    
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}

function getPromptForTransformType(type: string): string {
  const prompts: Record<string, string> = {
    'virtual-tryon': 'Apply this clothing item to the person in a realistic way.',
    'interior-design': 'Transform this interior space with the given furniture.',
    'headshot': 'Create a professional headshot photo.',
    'product-placement': 'Place this product naturally in the scene.',
  }
  return prompts[type] || 'Transform this image.'
}