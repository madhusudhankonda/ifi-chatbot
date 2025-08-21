'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Settings, Database, Key } from 'lucide-react'

export function DevNotice() {
  // Check if we're in development mode and Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isSupabaseConfigured = supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co')

  if (isSupabaseConfigured) {
    return null // Don't show notice if properly configured
  }

  return (
    <Card className="mx-auto max-w-2xl bg-amber-50 border-amber-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800">Development Mode</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          To enable authentication and full functionality, please configure your environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start space-x-3">
            <Database className="h-4 w-4 text-amber-600 mt-1" />
            <div>
              <p className="font-medium text-amber-800">1. Set up Supabase</p>
              <p className="text-sm text-amber-700">Create a project at supabase.com and get your URL and keys</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Key className="h-4 w-4 text-amber-600 mt-1" />
            <div>
              <p className="font-medium text-amber-800">2. Get OpenAI API Key</p>
              <p className="text-sm text-amber-700">Sign up at platform.openai.com and create an API key</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Settings className="h-4 w-4 text-amber-600 mt-1" />
            <div>
              <p className="font-medium text-amber-800">3. Update .env.local</p>
              <p className="text-sm text-amber-700">Replace placeholder values with your actual credentials</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-100 p-3 rounded-md">
          <p className="text-xs text-amber-700">
            <strong>Current status:</strong> Running in demo mode with mock authentication.
            Some features may not work until properly configured.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

