import { NextRequest, NextResponse } from 'next/server'
import { createDocument, updateDocumentStatus, insertDocumentChunks } from '@/lib/database'
import { createEmbedding } from '@/lib/openai'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

// Simple text splitter function
function splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    let end = start + chunkSize
    
    // If not at the end of text, try to break at a sentence or word boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastSpace = text.lastIndexOf(' ', end)
      
      if (lastPeriod > start + chunkSize / 2) {
        end = lastPeriod + 1
      } else if (lastSpace > start + chunkSize / 2) {
        end = lastSpace
      }
    }
    
    chunks.push(text.slice(start, end).trim())
    start = end - overlap
    
    if (start >= text.length) break
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}

// Extract text from different file types
async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  
  switch (file.type) {
    case 'text/plain':
      return Buffer.from(buffer).toString('utf-8')
    
    case 'application/pdf':
      try {
        // Load pdf-parse library safely by requiring the main module
        const pdfParseLib = require('pdf-parse/lib/pdf-parse.js')
        const data = await pdfParseLib(Buffer.from(buffer))
        return data.text
      } catch (error) {
        console.error('PDF parsing error:', error)
        throw new Error('Failed to extract text from PDF file')
      }
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      try {
        // Use require instead of dynamic import to avoid initialization issues
        const mammoth = require('mammoth')
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
        return result.value
      } catch (error) {
        console.error('DOCX parsing error:', error)
        throw new Error('Failed to extract text from DOCX file')
      }
    
    default:
      throw new Error('Unsupported file type')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'No file uploaded' 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false,
        error: 'File too large. Maximum size is 10MB' 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid file type. Only PDF, DOCX, and TXT files are allowed' 
      }, { status: 400 })
    }

    // Check if services are configured
    const openaiKey = process.env.OPENAI_API_KEY
    const databaseUrl = process.env.DATABASE_URL

    if (!openaiKey || !openaiKey.startsWith('sk-')) {
      return NextResponse.json({ 
        success: false,
        error: 'OpenAI API key not configured. Please add your OpenAI API key to .env.local',
        needsConfig: true
      }, { status: 500 })
    }

    if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
      return NextResponse.json({ 
        success: false,
        error: 'Database not configured. Please add your DATABASE_URL to .env.local',
        needsConfig: true
      }, { status: 500 })
    }

    // Create document record
    const document = await createDocument({
      filename: `${Date.now()}_${file.name}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: 'development-user' // TODO: Use actual user ID when auth is implemented
    })

    try {
      // Extract text from file
      const text = await extractText(file)

      if (!text.trim()) {
        throw new Error('No text content found in file')
      }

      // Split text into chunks
      const chunks = splitText(text, 1000, 200)

      // Create embeddings for chunks
      const chunksWithEmbeddings = []
      
      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index]
        const embedding = await createEmbedding(chunk)
        
        chunksWithEmbeddings.push({
          documentId: document.id,
          content: chunk,
          embedding,
          metadata: {
            chunkIndex: index,
            filename: document.original_name,
            mimeType: document.mime_type
          }
        })
      }

      // Save chunks to database
      await insertDocumentChunks(chunksWithEmbeddings)

      // Update document status
      await updateDocumentStatus(document.id, 'completed', undefined, chunks.length)

      return NextResponse.json({
        success: true,
        data: {
          documentId: document.id,
          filename: document.original_name,
          chunkCount: chunks.length,
          status: 'completed'
        }
      })

    } catch (processingError: any) {
      console.error('File processing error:', processingError)
      
      // Update document status with error
      await updateDocumentStatus(document.id, 'failed', processingError.message)

      return NextResponse.json({
        success: false,
        error: `File processing failed: ${processingError.message}`
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error: ' + error.message
      },
      { status: 500 }
    )
  }
}