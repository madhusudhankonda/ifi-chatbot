import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY

// Check if OpenAI is configured
const hasValidOpenAIConfig = openaiApiKey && openaiApiKey.startsWith('sk-')

const openai = hasValidOpenAIConfig 
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null

export async function createEmbedding(text: string): Promise<number[]> {
  if (!hasValidOpenAIConfig || !openai) {
    throw new Error('OpenAI API key not configured. Please add your OpenAI API key to .env.local')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
      dimensions: 1536, // Limit to 1536 dimensions for pgvector compatibility
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw new Error('Failed to create embedding')
  }
}

export async function createChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  stream: boolean = false
) {
  if (!hasValidOpenAIConfig || !openai) {
    throw new Error('OpenAI API key not configured. Please add your OpenAI API key to .env.local')
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream,
    })

    return response
  } catch (error) {
    console.error('Error creating chat completion:', error)
    throw new Error('Failed to generate response')
  }
}

export async function createStreamingChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
) {
  if (!hasValidOpenAIConfig || !openai) {
    throw new Error('OpenAI API key not configured. Please add your OpenAI API key to .env.local')
  }

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('Error creating streaming chat completion:', error)
    throw new Error('Failed to generate streaming response')
  }
}

export { openai }
