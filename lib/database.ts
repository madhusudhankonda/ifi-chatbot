import { Pool } from 'pg'

// Database configuration
const databaseUrl = process.env.DATABASE_URL
const hasValidDatabaseConfig = databaseUrl && databaseUrl.startsWith('postgresql://')

const pool = hasValidDatabaseConfig 
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;')
    
    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        uploaded_by VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'uploading',
        error_message TEXT,
        chunk_count INTEGER DEFAULT 0
      );
    `)
    
    // Create document_chunks table with vector embeddings (1536 dimensions for text-embedding-3-large)
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    // Create index for vector similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
      ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    `)
    
    // Create chat_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    // Create chat_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    client.release()
  }
}

// Document operations
export async function createDocument(documentData: {
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
}) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      `INSERT INTO documents (filename, original_name, mime_type, size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [documentData.filename, documentData.originalName, documentData.mimeType, documentData.size, documentData.uploadedBy]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function updateDocumentStatus(id: number, status: string, errorMessage?: string, chunkCount?: number) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      `UPDATE documents 
       SET status = $1, error_message = $2, chunk_count = $3, uploaded_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, errorMessage || null, chunkCount || null, id]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function getDocuments() {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM documents ORDER BY uploaded_at DESC'
    )
    
    return result.rows
  } finally {
    client.release()
  }
}

export async function deleteDocument(id: number) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    await client.query('DELETE FROM documents WHERE id = $1', [id])
    return true
  } finally {
    client.release()
  }
}

// Document chunk operations
export async function insertDocumentChunks(chunks: Array<{
  documentId: number
  content: string
  embedding: number[]
  metadata: any
}>) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO document_chunks (document_id, content, embedding, metadata)
         VALUES ($1, $2, $3, $4)`,
        [chunk.documentId, chunk.content, JSON.stringify(chunk.embedding), chunk.metadata]
      )
    }
    
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function searchSimilarChunks(queryEmbedding: number[], limit: number = 5) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      `SELECT 
         dc.id,
         dc.content,
         dc.metadata,
         d.filename,
         d.original_name,
         1 - (dc.embedding <=> $1::vector) as similarity
       FROM document_chunks dc
       JOIN documents d ON dc.document_id = d.id
       WHERE d.status = 'completed'
       ORDER BY dc.embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(queryEmbedding), limit]
    )
    
    return result.rows
  } finally {
    client.release()
  }
}

// Chat session operations
export async function createChatSession(userId: string, sessionId?: string) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    let result
    if (sessionId) {
      // Try to create with specific session ID, or update if exists
      result = await client.query(
        'INSERT INTO chat_sessions (id, user_id) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING *',
        [sessionId, userId]
      )
    } else {
      // Create with auto-generated UUID
      result = await client.query(
        'INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING *',
        [userId]
      )
    }
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function saveChatMessage(sessionId: string, content: string, role: 'user' | 'assistant') {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'INSERT INTO chat_messages (session_id, content, role) VALUES ($1, $2, $3) RETURNING *',
      [sessionId, content, role]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function getChatHistory(sessionId: string) {
  if (!hasValidDatabaseConfig || !pool) {
    throw new Error('Database not configured. Please add your DATABASE_URL to .env.local')
  }
  
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    )
    
    return result.rows
  } finally {
    client.release()
  }
}

export { pool }
