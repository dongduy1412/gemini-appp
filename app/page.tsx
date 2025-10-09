'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { UseCaseSelector } from '@/components/use-case-selector'
import { HistorySidebar } from '@/components/history-sidebar'
import { Sparkles, CheckCircle, AlertCircle, Download, Upload, X } from 'lucide-react'

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File quá lớn! Tối đa 5MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const newImages = [...images]
      newImages[index] = event.target?.result as string
      setImages(newImages)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

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
        
        // Save to history
        const historyItem = {
          id: Date.now().toString(),
          transformType: selectedUseCase,
          inputImages: images,
          outputImage: data.result,
          createdAt: new Date().toISOString()
        }
        
        try {
          const history = JSON.parse(localStorage.getItem('gemini_history') || '[]')
          history.unshift(historyItem)
          
          if (history.length > 20) {
            history.length = 20
          }
          
          localStorage.setItem('gemini_history', JSON.stringify(history))
        } catch (error) {
          console.error('Failed to save history:', error)
        }
        
        // Trigger history refresh
        setHistoryRefresh(prev => prev + 1)
        
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
    setResult(imageBase64)
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
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                
                <div className={`grid ${maxImages === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {[...Array(maxImages)].map((_, index) => (
                    <div key={index} className="relative">
                      {images[index] ? (
                        <div className="relative group">
                          <img
                            src={images[index]}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            disabled={generating}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-600 font-medium">
                              Kéo thả ảnh vào đây hoặc click để chọn
                            </p>
                            <p className="text-xs text-gray-500">
                              Tối đa {maxImages} ảnh, mỗi ảnh ≤ 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, index)}
                            disabled={generating}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
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
                <div className="flex justify-center">
                  <img
                    src={result}
                    alt="Kết quả đã tạo"
                    className="max-w-full max-h-[600px] rounded-lg border-2 border-gray-200 object-contain"
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}