'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage, User, Citation } from '@/types'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, MessageSquare, X } from 'lucide-react'
import { generateId, generateUUID } from '@/lib/utils'

interface ChatInterfaceProps {
  user: User
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sessionId] = useState<string>(() => generateUUID()) // Generate session ID once
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [showCitationPanel, setShowCitationPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Create assistant message placeholder
      const assistantMessageId = generateId()
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessageId(assistantMessageId)

      // Send request to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          userId: user.id,
          sessionId: sessionId // Use the persistent session ID
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let accumulatedContent = ''
        let citations: Citation[] = []
        let citationsReceived = false
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value)
          
          // Check for citations at the beginning
          if (!citationsReceived && chunk.includes('__CITATIONS__')) {
            const citationsMatch = chunk.match(/__CITATIONS__(.*?)__END_CITATIONS__/)
            if (citationsMatch) {
              try {
                citations = JSON.parse(citationsMatch[1])
                citationsReceived = true
                // Remove citations from content
                const contentAfterCitations = chunk.replace(/__CITATIONS__.*?__END_CITATIONS__/, '')
                accumulatedContent += contentAfterCitations
              } catch (e) {
                console.error('Error parsing citations:', e)
                accumulatedContent += chunk
              }
            } else {
              accumulatedContent += chunk
            }
          } else {
            accumulatedContent += chunk
          }
          
          // Update the streaming message
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: accumulatedContent, citations: citations }
              : msg
          ))
        }

        // Mark streaming as complete
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, isStreaming: false, citations: citations }
            : msg
        ))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev.slice(0, -1), errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation)
    setShowCitationPanel(true)
  }

  const closeCitationPanel = () => {
    setShowCitationPanel(false)
    setSelectedCitation(null)
  }

  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className={`flex flex-col transition-all duration-300 ${showCitationPanel ? 'w-2/3' : 'w-full'}`}>
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">IFI Chatbot</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={isLoading}
                >
                  <Trash2 size={14} className="mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <Card className="p-8 text-center max-w-md">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to IFI Chatbot</h3>
              <p className="text-muted-foreground mb-4">
                Start a conversation by asking questions about the uploaded documents. 
                I can help you find information quickly and accurately.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Try asking:</p>
                <ul className="text-left space-y-1">
                  <li>• "What are the latest policies?"</li>
                  <li>• "Summarize the financial report"</li>
                  <li>• "What are the compliance requirements?"</li>
                </ul>
              </div>
            </Card>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-0">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                  onCitationClick={handleCitationClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Thinking..." : "Ask me anything about the documents..."}
        />
      </div>
      </div>

      {/* Citation Panel */}
      {showCitationPanel && selectedCitation && (
        <div className="w-1/3 border-l bg-background flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Source Document</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCitationPanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Citation Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Document
                </h4>
                <p className="text-sm font-medium">{selectedCitation.filename}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Relevance Score
                </h4>
                <p className="text-sm">
                  {Math.round(selectedCitation.similarity * 100)}% match
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Source Text
                </h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCitation.content}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

