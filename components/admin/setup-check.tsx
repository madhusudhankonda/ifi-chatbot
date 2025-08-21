'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Database, Key, Settings } from 'lucide-react'

interface SetupStatus {
  supabase: boolean
  openai: boolean
  database: boolean
}

export function SetupCheck() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    supabase: false,
    openai: false,
    database: false
  })

  useEffect(() => {
    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const hasSupabase = supabaseUrl.startsWith('https://') && supabaseKey.length > 20

    // For OpenAI and Database, we need to check via API since they're server-side only
    const checkServerConfig = async () => {
      try {
        const response = await fetch('/api/config-check')
        const data = await response.json()
        
        setSetupStatus({
          supabase: hasSupabase,
          openai: data.openai || false,
          database: data.database || false
        })
      } catch (error) {
        // If API fails, show conservative status
        setSetupStatus({
          supabase: hasSupabase,
          openai: false,
          database: false
        })
      }
    }

    checkServerConfig()
  }, [])

  const allConfigured = setupStatus.supabase && setupStatus.openai && setupStatus.database
  const hasAnyConfiguration = setupStatus.supabase || setupStatus.openai || setupStatus.database

  if (allConfigured) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">All Systems Ready</h3>
              <p className="text-sm text-green-700">
                All services are configured. You can upload and process documents.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800">Configuration Required</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          Document upload requires external service configuration. Please set up the following:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Supabase Authentication</p>
                <p className="text-sm text-amber-700">Required for user management</p>
              </div>
            </div>
            <Badge variant={setupStatus.supabase ? "default" : "secondary"}>
              {setupStatus.supabase ? "✓ Configured" : "Not Set"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">OpenAI API</p>
                <p className="text-sm text-amber-700">Required for embeddings (text-embedding-3-large)</p>
              </div>
            </div>
            <Badge variant={setupStatus.openai ? "default" : "secondary"}>
              {setupStatus.openai ? "✓ Configured" : "Not Set"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Database (Neon/PostgreSQL)</p>
                <p className="text-sm text-amber-700">Required for storing documents and embeddings</p>
              </div>
            </div>
            <Badge variant={setupStatus.database ? "default" : "secondary"}>
              {setupStatus.database ? "✓ Configured" : "Not Set"}
            </Badge>
          </div>
        </div>
        
        <div className="bg-amber-100 p-3 rounded-md">
          <p className="text-xs text-amber-700">
            <strong>Setup Instructions:</strong> Follow the SETUP_GUIDE.md in your project root for step-by-step configuration.
            Once configured, restart the development server to apply changes.
          </p>
        </div>

        {hasAnyConfiguration && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Some services are configured. Upload functionality will be available 
              once all required services are set up.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
