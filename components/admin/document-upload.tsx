'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { SetupCheck } from './setup-check'

interface UploadStatus {
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  result?: any
}

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Only PDF, DOCX, and TXT files are allowed.`)
        return false
      }
      if (file.size > maxFileSize) {
        alert(`${file.name}: File too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      uploadFiles(validFiles)
    }
  }

  const uploadFiles = async (files: File[]) => {
    const newUploads: UploadStatus[] = files.map(file => ({
      file,
      status: 'uploading',
      progress: 0
    }))

    setUploads(prev => [...prev, ...newUploads])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploadIndex = uploads.length + i

      try {
        const formData = new FormData()
        formData.append('file', file)

        // Update status to uploading
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'uploading', progress: 50 }
            : upload
        ))

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (response.ok && result.success) {
          // Update status to completed
          setUploads(prev => prev.map((upload, index) => 
            index === uploadIndex 
              ? { ...upload, status: 'completed', progress: 100, result: result.data }
              : upload
          ))

          onUploadComplete?.()
        } else {
          // Update status to failed
          setUploads(prev => prev.map((upload, index) => 
            index === uploadIndex 
              ? { ...upload, status: 'failed', progress: 100, error: result.error }
              : upload
          ))
        }

      } catch (error: any) {
        console.error('Upload error:', error)
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'failed', progress: 100, error: error.message }
            : upload
        ))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <SetupCheck />
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files to add them to the knowledge base using OpenAI text-embedding-3-large
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Files</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            Select Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="text-xs text-gray-500 mt-4">
            Supported formats: PDF, DOCX, TXT • Maximum size: 10MB per file
          </div>
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Upload Progress</h4>
            {uploads.map((upload, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {upload.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-xs text-gray-500">
                        {formatFileSize(upload.file.size)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {upload.status === 'completed' && upload.result 
                        ? `${upload.result.chunkCount} chunks created`
                        : upload.status === 'failed' && upload.error
                        ? upload.error
                        : upload.status.charAt(0).toUpperCase() + upload.status.slice(1)
                      }
                    </span>
                    
                    {upload.status !== 'uploading' && upload.status !== 'processing' && (
                      <button
                        onClick={() => removeUpload(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {(upload.status === 'uploading' || upload.status === 'processing') && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
