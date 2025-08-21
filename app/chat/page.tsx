'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Header } from '@/components/layout/header'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { User } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, Upload, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const userIsAdmin = isAdmin(user)

  return (
    <div className="min-h-screen">
      <Header />
      
      {userIsAdmin ? (
        // Admin sees a dashboard with links to different functions
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
            <p className="text-gray-600">Manage documents and access the chat interface</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload PDF, DOCX, or TXT files to add them to the knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button className="w-full">
                    Go to Upload Interface
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat Interface
                </CardTitle>
                <CardDescription>
                  Ask questions about the uploaded documents using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/chat/interface">
                  <Button variant="outline" className="w-full">
                    Open Chat Interface
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-blue-900">Administrator Privileges</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    As an administrator, you can upload documents, manage the knowledge base, 
                    and access all chat features. Regular users can only access the chat interface.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Regular users see the chat interface directly
        <ChatInterface user={user} />
      )}
    </div>
  )
}
