export type TransformType = 'outfit' | 'interior' | 'headshot' | 'background'

export interface UseCase {
  id: TransformType
  title: string
  description: string
  icon: string
  imageCount: number
  examples: string[]
}

export interface Generation {
  id: string
  userId: string
  transformType: TransformType
  inputImages: string[]
  outputImage: string
  promptUsed?: string
  createdAt: string
}

export interface RateLimit {
  userId: string
  count: number
  resetAt: string
  remaining: number
}

export interface GenerateRequest {
  transformType: TransformType
  images: string[]
}

export interface GenerateResponse {
  success: boolean
  outputImage?: string
  error?: string
  rateLimit?: RateLimit
}