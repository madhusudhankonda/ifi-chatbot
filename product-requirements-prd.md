## **Product Requirements Document (PRD)**

**Project Name:** IFI Chatbot
**Goal:** Build a modern, elegant, and professional AI-powered chatbot application for International Financial Institutions (IFIs) that allows authenticated users to interact with a knowledge base, while administrators can upload new documents for ingestion.
**Deployment:** Render

---

### **1. Overview**

The IFI Chatbot is a web application where users can log in via Supabase authentication, chat with an AI assistant, and receive contextually accurate answers from ingested documents stored in a pgvector database (Neon). Administrators can securely upload documents, which are processed and ingested into the vector store for retrieval-augmented generation (RAG).

---

### **2. Tech Stack**

**Frontend:**

* React (with Next.js or Vite)
* TailwindCSS for styling (modern, responsive, elegant)
* shadcn/ui or Radix UI components for professional UI

**Backend:**

* Node.js (Express or Next.js API routes)
* LangChain.js for AI pipeline
* OpenAI GPT-4o or GPT-4 for LLM responses
* Supabase Auth for authentication and role-based access
* Neon Database (Postgres with pgvector) for vector store

**Deployment:**

* Render (frontend + backend)
* Supabase (Auth & storage)
* Neon (pgvector database)

---

### **3. Core Features**

#### 3.1 User Authentication

* Supabase authentication (email/password, Google OAuth optional)
* Role-based access: **Admin** and **User**
* Secure sessions with JWT handling

#### 3.2 Chatbot Interface

* Clean, minimalistic chat UI with user & bot messages
* Streaming responses for real-time typing effect
* Support for Markdown (links, code snippets, bullet lists)
* Scrollable chat history within the session

#### 3.3 Vector Database Integration

* Store embeddings in pgvector on Neon
* Use OpenAI embeddings (`text-embedding-3-large`) for document chunks
* Efficient similarity search for RAG

#### 3.4 Data Ingestion (Admin Only)

* Admin dashboard for uploading files (PDF, DOCX, TXT)
* Backend pipeline:

  1. Upload to Supabase storage
  2. Extract text from documents
  3. Chunk text
  4. Create embeddings
  5. Store embeddings + metadata in pgvector
* Upload status/progress indicator

#### 3.5 Deployment

* Fully deployable on Render (frontend & backend as separate services or monorepo)
* Environment variables stored securely in Render dashboard

---

### **4. Detailed Development Steps**

#### Step 1: Project Setup

* Initialize monorepo (frontend + backend) using Turborepo or separate repos
* Configure ESLint, Prettier, and TypeScript for code quality
* Install dependencies:

  ```bash
  # Frontend
  npm install react next tailwindcss @supabase/supabase-js @radix-ui/react-dialog @radix-ui/react-input @radix-ui/react-button

  # Backend
  npm install express langchain openai pg pgvector multer supabase-js cors dotenv
  ```

#### Step 2: Supabase Authentication

* Set up Supabase project and enable Auth
* Implement signup/login/logout flow in frontend
* Protect routes based on roles (`user`, `admin`)

#### Step 3: Database (Neon + pgvector)

* Create Neon Postgres database
* Enable `pgvector` extension:

  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
* Create table for storing embeddings:

  ```sql
  CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536),
    metadata JSONB
  );
  ```

#### Step 4: Backend API

* Endpoint `/api/chat`:

  * Accepts user message
  * Performs similarity search in pgvector
  * Sends relevant chunks + query to GPT
  * Returns streamed AI response
* Endpoint `/api/upload` (Admin only):

  * Accepts file upload via `multer`
  * Extracts text (e.g., using `pdf-parse` or `docx` parser)
  * Chunks text (LangChain text splitter)
  * Creates embeddings and stores them in pgvector

#### Step 5: Chat UI

* Responsive design with TailwindCSS
* Chat bubbles (user: right aligned, bot: left aligned)
* Typing indicator for bot
* Scroll-to-latest-message behavior

#### Step 6: Admin Dashboard

* File upload form with progress indicator
* List of uploaded documents
* Option to reprocess or delete documents

#### Step 7: Deployment

* Configure environment variables in Render:

  * `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`
* Deploy backend and frontend services
* Connect frontend to backend API endpoint

---

### **5. Non-Functional Requirements**

* **Performance:** Vector search must return results under 300ms
* **Security:** Role-based route protection; only Admin can upload
* **Scalability:** Support up to 100K document chunks without performance degradation
* **Maintainability:** Clear code structure and documentation

---

### **6. Future Enhancements**

* Support multilingual ingestion and Q\&A
* Add analytics dashboard for admin (usage stats, query logs)
* Enable document tagging and categorization for better retrieval

