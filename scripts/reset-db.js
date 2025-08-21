const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  const client = await pool.connect()
  
  try {
    console.log('Resetting database...')
    
    // Drop existing tables (in reverse order due to foreign key constraints)
    await client.query('DROP TABLE IF EXISTS chat_messages CASCADE;')
    console.log('✓ chat_messages table dropped')
    
    await client.query('DROP TABLE IF EXISTS chat_sessions CASCADE;')
    console.log('✓ chat_sessions table dropped')
    
    await client.query('DROP TABLE IF EXISTS document_chunks CASCADE;')
    console.log('✓ document_chunks table dropped')
    
    await client.query('DROP TABLE IF EXISTS documents CASCADE;')
    console.log('✓ documents table dropped')
    
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✓ pgvector extension enabled')
    
    // Create documents table
    await client.query(`
      CREATE TABLE documents (
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
    console.log('✓ documents table created')
    
    // Create document_chunks table with vector embeddings (1536 dimensions for text-embedding-3-large)
    await client.query(`
      CREATE TABLE document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ document_chunks table created with 1536 dimensions')
    
    // Create index for vector similarity search
    await client.query(`
      CREATE INDEX document_chunks_embedding_idx 
      ON document_chunks USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    `)
    console.log('✓ vector similarity index created')
    
    // Create chat_sessions table
    await client.query(`
      CREATE TABLE chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ chat_sessions table created')
    
    // Create chat_messages table
    await client.query(`
      CREATE TABLE chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ chat_messages table created')
    
    console.log('🎉 Database reset successfully with correct vector dimensions!')
    
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

resetDatabase()
