'use client'

import { ChatMessage, Citation } from '@/types'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  onCitationClick?: (citation: Citation) => void
}

export function MessageBubble({ message, isStreaming, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  // Function to render content with clickable citations
  const renderContentWithCitations = (content: string) => {
    if (!message.citations || message.citations.length === 0) {
      return content
    }

    // Replace [1], [2], etc. with clickable citation links
    let processedContent = content
    message.citations.forEach((citation) => {
      const citationRegex = new RegExp(`\\[${citation.id}\\]`, 'g')
      processedContent = processedContent.replace(
        citationRegex,
        `<button class="citation-link" data-citation-id="${citation.id}">[${citation.id}]</button>`
      )
    })

    return processedContent
  }

  // Handle citation clicks
  const handleCitationClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.classList.contains('citation-link')) {
      const citationId = parseInt(target.getAttribute('data-citation-id') || '0')
      const citation = message.citations?.find(c => c.id === citationId)
      if (citation && onCitationClick) {
        onCitationClick(citation)
      }
    }
  }

  return (
    <div className={cn(
      "flex gap-3 p-4 chat-message",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-secondary-foreground"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-card border"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              onClick={handleCitationClick}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic mb-2">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {renderContentWithCitations(message.content)}
              </ReactMarkdown>
              {isStreaming && (
                <span className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  )
}

