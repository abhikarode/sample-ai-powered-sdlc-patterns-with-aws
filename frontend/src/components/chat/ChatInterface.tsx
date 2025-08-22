// Chat Interface Component
// Main chat interface with message display and input

import { API_CONFIG } from '@/config/aws-config';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage, DocumentSource } from '@/types/api';
import { ChatInterfaceProps } from '@/types/components';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { TypingIndicator } from './TypingIndicator';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onNewConversation,
  maxHeight = '600px'
}) => {
  const { authState } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation history if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory(conversationId);
    }
  }, [conversationId]);

  const loadConversationHistory = async (convId: string) => {
    try {
      setIsLoading(true);
      
      // Get ID token from authState or fallback to localStorage (API Gateway requires ID token, not access token)
      let idToken = authState.idToken;
      if (!idToken) {
        // Look for Cognito ID token in localStorage
        const tokenKey = Object.keys(localStorage).find(key => 
          key.includes('CognitoIdentityServiceProvider') && key.includes('idToken')
        );
        idToken = tokenKey ? localStorage.getItem(tokenKey) || undefined : undefined;
      }

      if (!idToken) {
        throw new Error('No ID token available');
      }

      const response = await fetch(`${API_CONFIG.baseURL}/chat/history/${convId}`, {
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation history');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading conversation history:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      messageId: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get ID token from authState or fallback to localStorage (API Gateway requires ID token, not access token)
      let idToken = authState.idToken;
      if (!idToken) {
        // Look for Cognito ID token in localStorage
        const tokenKey = Object.keys(localStorage).find(key => 
          key.includes('CognitoIdentityServiceProvider') && key.includes('idToken')
        );
        idToken = tokenKey ? localStorage.getItem(tokenKey) || undefined : undefined;
      }

      if (!idToken) {
        throw new Error('No ID token available');
      }

      const response = await fetch(`${API_CONFIG.baseURL}/chat/ask`, {
        method: 'POST',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: messageText,
          userId: authState.user?.sub || 'anonymous',
          conversationId: conversationId,
          includeSourceDetails: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        messageId: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.answer,
        timestamp: data.timestamp,
        sources: data.sources,
        modelUsed: data.modelUsed
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Handle specific error types
      let errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      let shouldRetry = true;
      
      if (err instanceof Error) {
        const errorResponse = err.message;
        if (errorResponse.includes('KNOWLEDGE_BASE_NOT_FOUND')) {
          errorMessage = 'The knowledge base is not available. Please contact an administrator.';
          shouldRetry = false;
        } else if (errorResponse.includes('RATE_LIMIT_EXCEEDED')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          shouldRetry = true;
        } else if (errorResponse.includes('AUTHORIZATION_FAILED')) {
          errorMessage = 'You do not have permission to access this service. Please contact an administrator.';
          shouldRetry = false;
        } else if (errorResponse.includes('KNOWLEDGE_BASE_BUSY')) {
          errorMessage = 'The knowledge base is currently processing documents. Please try again in a few minutes.';
          shouldRetry = true;
        }
      }
      
      setError(shouldRetry ? 'Failed to get AI response. Please try again.' : errorMessage);
      
      // Add error message
      const assistantErrorMessage: ChatMessage = {
        messageId: `error-${Date.now()}`,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    if (messageIndex === -1) return;

    const userMessageIndex = messageIndex - 1;
    const userMessageObj = messages[userMessageIndex];
    if (userMessageIndex >= 0 && userMessageObj && userMessageObj.type === 'user') {
      const userMessage = userMessageObj.content;
      
      // Remove the failed assistant message
      setMessages(prev => prev.filter(m => m.messageId !== messageId));
      
      // Retry the request
      await handleSendMessage(userMessage);
    }
  };

  const handleSourceClick = (source: DocumentSource) => {
    // Handle source click - could open document viewer, navigate to document, etc.
    console.log('Source clicked:', source);
    
    // For now, just show an alert with source info
    // In a real implementation, this would open a document viewer or navigate to the document
    alert(`Document: ${source.fileName}\nConfidence: ${Math.round(source.confidence * 100)}%\nExcerpt: ${source.excerpt.substring(0, 100)}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
      style={{ height: maxHeight }}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
          <p className="text-sm text-white/60">
            {conversationId ? 'Continuing conversation' : 'Ask me anything about your documents'}
          </p>
        </div>
        {onNewConversation && (
          <button
            onClick={onNewConversation}
            className="px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
          >
            New Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Start a conversation</h3>
                  <p className="text-white/60">Ask questions about your uploaded documents</p>
                </div>
              </div>
            </div>
          )}

          <MessageList
            messages={messages}
            isLoading={false}
            onRetry={handleRetry}
            onSourceClick={handleSourceClick}
          />

          {/* Typing Indicator */}
          <TypingIndicator isVisible={isLoading} />

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-white/10">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask a question about your documents..."
          maxLength={500}
        />
      </div>
    </motion.div>
  );
};