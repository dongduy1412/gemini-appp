'use client'

import { useEffect, useState } from 'react'
import { Clock, ImageIcon } from 'lucide-react'

interface HistoryItem {
  id: string
  transformType: string
  inputImages: string[]
  outputImage: string
  createdAt: string
}

interface HistorySidebarProps {
  onSelectImage: (image: string) => void
  refreshTrigger: number
}

export function HistorySidebar({ onSelectImage, refreshTrigger }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        console.log('📚 Loading history from D1...')
        
        const res = await fetch('/api/history')
        
        if (res.ok) {
          const data = await res.json()
          console.log('✅ Loaded history:', data.images?.length || 0, 'items')
          setHistory(data.images || [])
        } else {
          console.error('❌ Failed to load history:', res.status)
          setHistory([])
        }
      } catch (error) {
        console.error('❌ Error loading history:', error)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }
    
    loadHistory()
  }, [refreshTrigger])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">Lịch sử</h2>
        {history.length > 0 && (
          <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
            {history.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Chưa có lịch sử</p>
          <p className="text-xs text-gray-400 mt-1">Tạo ảnh để xem lịch sử</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                console.log('🖼️ Selected history item:', item.id)
                onSelectImage(item.outputImage)
              }}
              className="w-full text-left group"
            >
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-600 transition">
                <img
                  src={item.outputImage}
                  alt={item.transformType}
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load image:', item.id)
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium px-2 py-1 bg-black/50 rounded">
                    Click để xem
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-600 truncate capitalize">
                  {item.transformType.replace(/-/g, ' ')}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}