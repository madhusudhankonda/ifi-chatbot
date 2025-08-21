'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { DocumentList } from '@/components/admin/document-list'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User } from '@/types'
import { FileText, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'

export default function DocumentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        
        if (!currentUser || !isAdmin(currentUser)) {
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
            <p className="text-muted-foreground">Loading documents...</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
                <p className="text-gray-600">View and manage all uploaded documents</p>
              </div>
            </div>
            
            <Link href="/admin">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </Button>
            </Link>
          </div>

          {/* Document List */}
          <DocumentList refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  )
}

