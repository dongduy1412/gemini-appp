'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { UseCaseSelector } from '@/components/use-case-selector'
import { ImageUploader } from '@/components/image-uploader'
import { HistorySidebar } from '@/components/history-sidebar'
import { Sparkles, CheckCircle, AlertCircle, Download } from 'lucide-react'

type TransformType = 'virtual-tryon' | 'interior-design' | 'headshot' | 'product-placement'
interface User {
  id: string
  email: string
  name: string
  image: string
}

interface SessionResponse {
  user: User
}

interface GenerateResponse {
  result?: string
  error?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUseCase, setSelectedUseCase] = useState<TransformType | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json() as SessionResponse
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }
  checkAuth()
}, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const maxImages = selectedUseCase === 'headshot' ? 1 : 2

  const handleGenerate = async () => {
  if (!selectedUseCase || images.length === 0) {
    setMessage({ type: 'error', text: 'Vui lòng chọn kiểu chuyển đổi và tải ảnh lên' })
    return
  }

  setGenerating(true)
  setMessage(null)
  setResult(null)

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transformType: selectedUseCase,
        images,
      }),
    })

    const data = await res.json() as GenerateResponse

    if (res.ok && data.result) {
      setResult(data.result)
      setMessage({ type: 'success', text: 'Tạo ảnh thành công!' })
      
      // 🔥 LƯU VÀO HISTORY
      const historyItem = {
        id: Date.now().toString(),
        transformType: selectedUseCase,
        inputImages: images,
        outputImage: data.result,
        createdAt: new Date().toISOString()
      }
      
      // Save to localStorage
      try {
        const history = JSON.parse(localStorage.getItem('gemini_history') || '[]')
        history.unshift(historyItem) // Add to beginning
        
        if (history.length > 20) {
          history.length = 20
        }
        
        localStorage.setItem('gemini_history', JSON.stringify(history))
        console.log('✅ Saved to history:', historyItem.id)
      } catch (error) {
        console.error('❌ Failed to save history:', error)
      }
      
      // Trigger history refresh
      setHistoryRefresh(prev => prev + 1)
      console.log('🔄 History refresh triggered')
      
    } else {
      setMessage({ type: 'error', text: data.error || 'Tạo ảnh thất bại' })
    }
  } catch (error: any) {
    setMessage({ type: 'error', text: error.message || 'Lỗi kết nối' })
  } finally {
    setGenerating(false)
  }
}



  const handleSelectFromHistory = (imageBase64: string) => {
    setImages([imageBase64])
    setMessage({ type: 'success', text: 'Đã tải ảnh từ lịch sử' })
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result
    link.download = `gemini-${selectedUseCase}-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Transform your photos with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* History Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <HistorySidebar 
              onSelectImage={handleSelectFromHistory}
              refreshTrigger={historyRefresh}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {/* Step 1: Select Use Case */}
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bước 1: Chọn kiểu chuyển đổi
              </h3>
              <UseCaseSelector selected={selectedUseCase} onSelect={setSelectedUseCase} />
            </section>

            {/* Step 2: Upload Images */}
            {selectedUseCase && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Bước 2: Tải ảnh lên
                </h3>
                <ImageUploader
                  images={images}
                  maxImages={maxImages}
                  onImagesChange={setImages}
                  disabled={generating}
                />
              </section>
            )}

            {/* Step 3: Generate */}
            {selectedUseCase && images.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tạo ảnh
                    </>
                  )}
                </button>

                {message && (
                  <div
                    className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                      message.type === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        message.type === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Result */}
            {result && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Kết quả</h3>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </button>
                </div>
                <img
                  src={result}
                  alt="Kết quả đã tạo"
                  className="w-full rounded-lg border-2 border-gray-200"
                />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}