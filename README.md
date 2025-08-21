# IFI Chatbot

A modern, professional AI-powered chatbot application for International Financial Institutions (IFIs) that allows authenticated users to interact with a knowledge base, while administrators can upload new documents for ingestion.

## Features

- 🤖 **AI-Powered Chat**: Intelligent conversations using GPT-4 with document context
- 📚 **Document Q&A**: Upload and query PDF, DOCX, and TXT documents
- 🔐 **Role-Based Access**: Secure authentication with user and admin roles
- ⚡ **Fast Search**: Vector-based similarity search with sub-300ms responses
- 🎨 **Modern UI**: Beautiful, responsive design with TailwindCSS and shadcn/ui
- 📱 **Real-time Streaming**: Live typing effects for AI responses
- 🔄 **RAG Pipeline**: Retrieval-Augmented Generation for accurate answers

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **React Markdown** - Markdown rendering for AI responses

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **LangChain.js** - AI pipeline and document processing
- **OpenAI GPT-4** - Language model for conversations
- **OpenAI Embeddings** - text-embedding-3-large for vector search

### Database & Auth
- **Neon Database** - Postgres with pgvector extension
- **pgvector** - Vector similarity search
- **Supabase Auth** - Authentication and user management

### Deployment
- **Render** - Cloud platform deployment
- **Environment Variables** - Secure configuration management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Neon Database account
- Supabase account
- OpenAI API key

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ifi-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Database Configuration (Neon)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

The database will be automatically initialized when you run `npm install` or you can run it manually:

```bash
npm run init-db
```

This creates the necessary tables:
- `documents` - Document metadata
- `document_chunks` - Text chunks with embeddings
- `chat_sessions` - User chat sessions
- `chat_messages` - Chat message history

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Users
1. **Sign Up/Login**: Create an account or sign in
2. **Start Chatting**: Navigate to `/chat` and ask questions
3. **Query Documents**: Ask about uploaded document content
4. **View Responses**: Get AI-powered answers with source references

### For Administrators
1. **Access Admin Panel**: Navigate to `/admin` (admin role required)
2. **Upload Documents**: Upload PDF, DOCX, or TXT files
3. **Manage Library**: View, monitor, and delete documents
4. **Monitor Status**: Track document processing and chunk creation

## API Endpoints

### Chat API
- **POST** `/api/chat` - Send messages and get AI responses
- Supports streaming responses
- Includes vector search for relevant context

### Upload API
- **POST** `/api/upload` - Upload documents (admin only)
- Supports PDF, DOCX, TXT files
- Automatic text extraction and chunking
- Creates embeddings for vector search

### Documents API
- **GET** `/api/documents` - List all documents (admin only)
- **DELETE** `/api/documents?id=<id>` - Delete document (admin only)

## Document Processing Pipeline

1. **Upload**: Admin uploads file via web interface
2. **Text Extraction**: Extract text from PDF/DOCX/TXT
3. **Chunking**: Split text into manageable chunks (1000 chars)
4. **Embeddings**: Create vector embeddings using OpenAI
5. **Storage**: Save chunks and embeddings to pgvector database
6. **Indexing**: Create vector similarity index for fast search

## Deployment

### Render Deployment

1. **Create Render Account**: Sign up at render.com
2. **Connect Repository**: Link your GitHub repository
3. **Configure Service**: 
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Environment Variables**: Add all required env vars
5. **Deploy**: Render will automatically deploy your application

### Environment Variables for Production

Ensure all environment variables are configured in Render:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Performance

- **Vector Search**: Sub-300ms response times
- **Streaming**: Real-time AI response generation
- **Chunking**: Optimized 1000-character chunks with 200-char overlap
- **Indexing**: ivfflat index for efficient similarity search
- **Scalability**: Supports 100K+ document chunks

## Security

- **Authentication**: Supabase JWT-based authentication
- **Role-Based Access**: User/Admin role separation
- **Route Protection**: Server-side authentication checks
- **File Validation**: Type and size restrictions
- **Environment Variables**: Secure configuration management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary to International Financial Institutions.

## Support

For technical support or questions:
- Check the documentation
- Review the code comments
- Create an issue in the repository

