import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding, createStreamingChatCompletion } from '@/lib/openai'
import { searchSimilarChunks, saveChatMessage, createChatSession } from '@/lib/database'
// Note: For API routes, we need to implement server-side auth check
// import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication check for API routes
    // For now, we'll proceed without auth for development purposes

    const { message, sessionId, userId } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Ensure chat session exists (create if needed)
    if (sessionId && userId) {
      try {
        await createChatSession(userId, sessionId)
      } catch (error) {
        // Session might already exist, which is fine
        console.log('Session creation info:', error)
      }
    }

    // Create embedding for the user's message
    const queryEmbedding = await createEmbedding(message)

    // Search for similar document chunks
    const similarChunks = await searchSimilarChunks(queryEmbedding, 5)

    // Prepare context from similar chunks
    const context = similarChunks
      .map(chunk => `Document: ${chunk.filename}\nContent: ${chunk.content}`)
      .join('\n\n')

    // Prepare system message with context
    const systemMessage = `You are an AI assistant for International Financial Institutions (IFI). You help users find information from uploaded documents.

Context from relevant documents:
${context}

Instructions:
- Use the provided context to answer the user's question
- If the context doesn't contain relevant information, say so clearly
- Provide accurate, helpful responses based on the document content
- Format your responses clearly with proper structure
- If asked about specific documents, reference them by name
- Be professional and concise`

    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: message }
    ]

    // Save user message to database (if sessionId provided)
    if (sessionId) {
      await saveChatMessage(sessionId, message, 'user')
    }

    // Create streaming response
    const stream = await createStreamingChatCompletion(messages)

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    let assistantResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              assistantResponse += content
              controller.enqueue(encoder.encode(content))
            }
          }

          // Save assistant response to database
          if (sessionId && assistantResponse) {
            await saveChatMessage(sessionId, assistantResponse, 'assistant')
          }

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
