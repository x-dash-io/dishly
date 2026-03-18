import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';

export interface QAMessage {
  id: string;
  question: string;
  answer: string;
  stepIndex: number;
  isStreaming: boolean;
}

export function useCookQA(recipeId: string) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();
  const tokenRef = useRef<string | null>(null);

  // Get token once and cache it
  useEffect(() => {
    getToken().then(token => {
      tokenRef.current = token;
    });
  }, [getToken]);

  const ask = useCallback(async (question: string, stepIndex: number) => {
    const messageId = crypto.randomUUID();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

    // Add a streaming placeholder immediately
    setMessages(prev => [...prev, {
      id: messageId,
      question,
      answer: '',
      stepIndex,
      isStreaming: true
    }]);
    setIsLoading(true);

    try {
      // Fetch the streaming endpoint
      const response = await fetch(`${apiUrl}/ai/cook-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          current_step_index: stepIndex,
          question
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        
        // Update the message with accumulated text on every chunk
        setMessages(prev => prev.map(m =>
          m.id === messageId 
            ? { ...m, answer: accumulated, isStreaming: true } 
            : m
        ));
      }

      // Mark streaming complete
      setMessages(prev => prev.map(m =>
        m.id === messageId 
          ? { ...m, answer: accumulated, isStreaming: false } 
          : m
      ));

    } catch (err) {
      console.error('Cook QA error:', err);
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, answer: 'Sorry, I couldn\'t answer that. Try again.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getMessagesForStep = useCallback((stepIndex: number) => {
    return messages.filter(m => m.stepIndex === stepIndex);
  }, [messages]);

  return {
    messages,
    isLoading,
    ask,
    clearMessages,
    getMessagesForStep
  };
}
