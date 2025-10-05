'use client'

import { useSession, signOut } from 'next-auth/react'
import { Sparkles, LogOut } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Gemini Image Editor
            </h1>
          </div>

          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-gray-500">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}