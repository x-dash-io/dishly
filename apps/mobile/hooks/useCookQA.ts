import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { env } from '../src/config/env';

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

  // Refresh the token once per hook mount — Clerk tokens are short-lived
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getToken().then(t => {
      if (!cancelled) tokenRef.current = t;
    });
    return () => { cancelled = true; };
  }, [getToken]);

  const ask = useCallback(async (question: string, stepIndex: number) => {
    if (!question.trim() || isLoading) return;

    const messageId = crypto.randomUUID();

    // Refresh the token right before use — avoids stale token errors
    const token = await getToken();
    tokenRef.current = token;

    setMessages(prev => [...prev, {
      id: messageId,
      question: question.trim(),
      answer: '',
      stepIndex,
      isStreaming: true,
    }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${env.EXPO_PUBLIC_API_URL}/ai/cook-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          current_step_index: stepIndex,
          question: question.trim(),
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, answer: accumulated, isStreaming: true } : m
        ));
      }

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, answer: accumulated, isStreaming: false } : m
      ));

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, answer: "Sorry, I couldn't answer that. Try again.", isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, isLoading, getToken]);

  const getMessagesForStep = useCallback((stepIndex: number) =>
    messages.filter(m => m.stepIndex === stepIndex),
    [messages]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, ask, getMessagesForStep, clearMessages };
}
