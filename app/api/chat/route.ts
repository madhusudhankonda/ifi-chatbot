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

    // Prepare context from similar chunks with citations
    const contextWithCitations = similarChunks
      .map((chunk, index) => `[${index + 1}] Document: ${chunk.filename}\nContent: ${chunk.content}`)
      .join('\n\n')

    // Prepare system message with enhanced context
    const systemMessage = `You are an AI assistant for International Financial Institutions (IFI). You help users find information from uploaded documents.

Context from relevant documents:
${contextWithCitations}

Instructions:
- Provide comprehensive, detailed responses based on the document content
- Always include citations [1], [2], etc. when referencing specific information
- Use the citation numbers that correspond to the documents provided above
- Structure your responses with clear sections, bullet points, and detailed explanations
- If the context doesn't contain sufficient information, say so clearly and suggest what additional information might be needed
- When discussing policies, procedures, or regulations, provide specific details and context
- Include relevant background information to help users understand the full picture
- Be thorough rather than brief - users prefer detailed, informative responses
- Reference document names when discussing specific sources
- Format your responses professionally with clear organization`

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

    // Create citation metadata
    const citations = similarChunks.map((chunk, index) => ({
      id: index + 1,
      filename: chunk.filename,
      content: chunk.content,
      similarity: chunk.similarity
    }))

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    let assistantResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send citations first as a special message
          const citationsMessage = `__CITATIONS__${JSON.stringify(citations)}__END_CITATIONS__`
          controller.enqueue(encoder.encode(citationsMessage))

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
