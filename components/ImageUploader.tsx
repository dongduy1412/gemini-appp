'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

interface Props {
  images: string[]
  maxImages: number
  onImagesChange: (images: string[]) => void
  disabled?: boolean
}

export default function ImageUploader({
  images,
  maxImages,
  onImagesChange,
  disabled = false,
}: Props) {
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setError('')
    const newImages: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Max 10MB per image.')
        continue
      }

      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.')
        continue
      }

      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      newImages.push(base64)

      if (images.length + newImages.length >= maxImages) {
        break
      }
    }

    onImagesChange([...images, ...newImages].slice(0, maxImages))
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {canAddMore && (
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${
            disabled
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-primary-500 hover:bg-primary-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {images.length}/{maxImages} images (Max 10MB each)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple={maxImages > 1}
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Image {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}