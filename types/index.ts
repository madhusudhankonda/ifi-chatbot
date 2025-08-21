// Authentication Types
export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// Chat Types
export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  userId: string
  messages: ChatMessage[]
  created_at: Date
  updated_at: Date
}

// Document Types
export interface Document {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  uploaded_by: string
  uploaded_at: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error_message?: string
  chunk_count?: number
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding: number[]
  metadata: {
    pageNumber?: number
    section?: string
    [key: string]: any
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ChatResponse {
  message: string
  sources?: DocumentChunk[]
  sessionId?: string
}

export interface UploadResponse {
  documentId: string
  filename: string
  status: string
}

// Configuration Types
export interface AppConfig {
  maxFileSize: number
  allowedFileTypes: string[]
  maxTokens: number
  temperature: number
  embeddingModel: string
  chatModel: string
}

// Search Types
export interface SearchResult {
  chunk: DocumentChunk
  similarity: number
  document: Document
}

// Component Props Types
export interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export interface MessageBubbleProps {
  message: ChatMessage
  isUser: boolean
}

export interface UploadProgressProps {
  progress: number
  filename: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
}
