import { create } from 'zustand';
import { ChatMessage } from '@/core/types';

/**
 * Chat state management with Zustand
 * 
 * Manages conversation history and message state
 */
interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    }),
  
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  
  clearMessages: () => set({ messages: [] }),
}));
