'use client'

import { useEffect, useState } from 'react'
import { Generation } from '@/types'
import { Clock, AlertCircle } from 'lucide-react'

interface Props {
  onSelectImage: (imageBase64: string) => void
  refreshTrigger?: number
}

export default function HistorySidebar({ onSelectImage, refreshTrigger }: Props) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger])

  const fetchHistory = async () => {
  try {
    setLoading(true)
    const res = await fetch('/api/history')
    const data = await res.json()

    if (res.ok) {
      // Sửa từ data.generations thành data.history
      setGenerations(data.history || [])
    } else {
      setError(data.error || 'Failed to load history')
    }
  } catch (err) {
    setError('Failed to load history')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">History</h2>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && generations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No generations yet</p>
          <p className="text-xs mt-1">Your history will appear here</p>
        </div>
      )}

      {!loading && generations.length > 0 && (
        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
          {generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => onSelectImage(`data:image/png;base64,${gen.outputImage}`)}
              className="w-full group"
            >
              <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary-500 transition">
                <img
                  src={`data:image/png;base64,${gen.outputImage}`}
                  alt="Generated"
                  className="w-full h-32 object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                  <p className="text-white text-xs font-medium capitalize">
                    {gen.transformType.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-left">
                {new Date(gen.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}