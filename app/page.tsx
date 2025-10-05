'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import UseCaseSelector from '@/components/UseCaseSelector'
import ImageUploader from '@/components/ImageUploader'
import HistorySidebar from '@/components/HistorySidebar'
import { TransformType, GenerateResponse } from '@/types'
import { Sparkles, Download, AlertCircle, CheckCircle } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [selectedUseCase, setSelectedUseCase] = useState<TransformType | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const maxImages = selectedUseCase === 'headshot' ? 1 : 2

  const handleGenerate = async () => {
    if (!selectedUseCase || images.length === 0) {
      setMessage({ type: 'error', text: 'Please select a use case and upload images' })
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

      const data: GenerateResponse = await res.json()

      if (data.success && data.outputImage) {
        setResult(`data:image/png;base64,${data.outputImage}`)
        setMessage({
          type: 'success',
          text: `Success! ${data.rateLimit?.remaining || 0} generations remaining this hour.`,
        })
        setHistoryRefresh((prev) => prev + 1)
      } else {
        setMessage({ type: 'error', text: data.error || 'Generation failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectFromHistory = (imageBase64: string) => {
    setImages([imageBase64])
    setMessage({ type: 'success', text: 'Image loaded from history' })
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <HistorySidebar
              onSelectImage={handleSelectFromHistory}
              refreshTrigger={historyRefresh}
            />
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Step 1: Choose Transformation
              </h2>
              <UseCaseSelector selected={selectedUseCase} onSelect={setSelectedUseCase} />
            </section>

            {selectedUseCase && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Step 2: Upload Images
                </h2>
                <ImageUploader
                  images={images}
                  maxImages={maxImages}
                  onImagesChange={setImages}
                  disabled={generating}
                />
              </section>
            )}

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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Image
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

            {result && (
              <section className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Result</h2>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <img
                  src={result}
                  alt="Generated result"
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