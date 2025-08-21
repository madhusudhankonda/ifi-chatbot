'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getCurrentUser, signOut, isAdmin } from '@/lib/auth'
import { User } from '@/types'
import { MessageSquare, Shield, LogOut, Upload, FileText, Home } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    router.push('/')
  }

  if (isLoading) {
    return (
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">IFI Chatbot</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600">Loading...</div>
          </div>
        </div>
      </header>
    )
  }

  if (!user) {
    return (
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">IFI Chatbot</h1>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const userIsAdmin = isAdmin(user)

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-4">
            {userIsAdmin ? (
              <Shield className="h-8 w-8 text-primary" />
            ) : (
              <MessageSquare className="h-8 w-8 text-primary" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">IFI Chatbot</h1>
              <p className="text-xs text-gray-600">
                {userIsAdmin ? 'Administrator' : 'User'} Dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>

              {userIsAdmin && (
                <>
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Docs
                    </Button>
                  </Link>
                  
                  <Link href="/admin/documents">
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Manage Docs
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                <div className="font-medium">{user.email}</div>
                <div className="text-xs text-gray-500">
                  {userIsAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

