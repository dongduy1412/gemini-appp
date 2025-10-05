'use client'

import { UseCase, TransformType } from '@/types'
import { Shirt, Home, User, Image } from 'lucide-react'

const USE_CASES: UseCase[] = [
  {
    id: 'outfit',
    title: 'Virtual Try-On',
    description: 'Try on clothing from any image',
    icon: 'Shirt',
    imageCount: 2,
    examples: ['Upload your photo', 'Upload clothing image', 'See yourself wearing it'],
  },
  {
    id: 'interior',
    title: 'Interior Design',
    description: 'Place furniture in your room',
    icon: 'Home',
    imageCount: 2,
    examples: ['Upload furniture image', 'Upload room photo', 'See it placed naturally'],
  },
  {
    id: 'headshot',
    title: 'Professional Headshot',
    description: 'Transform casual photos to professional',
    icon: 'User',
    imageCount: 1,
    examples: ['Upload your photo', 'Get studio-quality headshot', 'Perfect for LinkedIn/CV'],
  },
  {
    id: 'background',
    title: 'Background Replace',
    description: 'Change photo backgrounds instantly',
    icon: 'Image',
    imageCount: 2,
    examples: ['Upload subject image', 'Upload new background', 'Seamless composite'],
  },
]

const IconMap = { Shirt, Home, User, Image }

interface Props {
  selected: TransformType | null
  onSelect: (type: TransformType) => void
}

export default function UseCaseSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {USE_CASES.map((useCase) => {
        const Icon = IconMap[useCase.icon as keyof typeof IconMap]
        const isSelected = selected === useCase.id

        return (
          <button
            key={useCase.id}
            onClick={() => onSelect(useCase.id)}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold text-base ${
                    isSelected ? 'text-primary-900' : 'text-gray-900'
                  }`}
                >
                  {useCase.title}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Requires:</span> {useCase.imageCount}{' '}
              {useCase.imageCount === 1 ? 'image' : 'images'}
            </div>
          </button>
        )
      })}
    </div>
  )
}