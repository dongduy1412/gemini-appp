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

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('gemini_history')
        if (saved) {
          setHistory(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Failed to load history:', error)
      }
    }
    loadHistory()
  }, [refreshTrigger])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">Lịch sử</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Chưa có lịch sử</p>
          <p className="text-xs text-gray-400 mt-1">Tạo ảnh để xem lịch sử</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectImage(item.outputImage)}
              className="w-full text-left group"
            >
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-600 transition">
                <img
                  src={item.outputImage}
                  alt={item.transformType}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                    Click để tái sử dụng
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-600 truncate capitalize">
                  {item.transformType.replace('-', ' ')}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}