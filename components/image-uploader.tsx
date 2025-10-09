'use client'

import { useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  images: string[]
  maxImages: number
  onImagesChange: (images: string[]) => void
  disabled?: boolean
}

export function ImageUploader({ images, maxImages, onImagesChange, disabled }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    for (let i = 0; i < Math.min(fileArray.length, remainingSlots); i++) {
      const file = fileArray[i]
      
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn! Tối đa 5MB')
        continue
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        onImagesChange([...images, base64])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {images.length < maxImages && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragActive ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-1">
              Kéo thả ảnh vào đây hoặc click để chọn
            </p>
            <p className="text-xs text-gray-500">
              Tối đa {maxImages} ảnh, mỗi ảnh ≤ 5MB
            </p>
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
