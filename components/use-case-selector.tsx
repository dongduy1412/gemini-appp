'use client'

import { Shirt, Home, User, Package } from 'lucide-react'

type TransformType = 'virtual-tryon' | 'interior-design' | 'headshot' | 'product-placement'

interface UseCaseSelectorProps {
  selected: TransformType | null
  onSelect: (type: TransformType) => void
}

const useCases = [
  {
    id: 'virtual-tryon' as TransformType,
    name: 'Virtual Try-On',
    description: 'Thử đồ ảo với AI',
    icon: Shirt,
    color: 'bg-blue-500'
  },
  {
    id: 'interior-design' as TransformType,
    name: 'Interior Design',
    description: 'Thiết kế nội thất',
    icon: Home,
    color: 'bg-green-500'
  },
  {
    id: 'headshot' as TransformType,
    name: 'Professional Headshot',
    description: 'Ảnh chân dung chuyên nghiệp',
    icon: User,
    color: 'bg-purple-500'
  },
  {
    id: 'product-placement' as TransformType,
    name: 'Product Placement',
    description: 'Đặt sản phẩm vào ảnh',
    icon: Package,
    color: 'bg-orange-500'
  }
]

export function UseCaseSelector({ selected, onSelect }: UseCaseSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {useCases.map((useCase) => {
        const Icon = useCase.icon
        const isSelected = selected === useCase.id

        return (
          <button
            key={useCase.id}
            onClick={() => onSelect(useCase.id)}
            className={`p-4 rounded-xl border-2 transition text-left ${
              isSelected
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${useCase.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{useCase.name}</h3>
                <p className="text-sm text-gray-600">{useCase.description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}