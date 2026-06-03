'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface SummaryParams {
  summaryType: string;
  periodStartDate: string;
  periodEndDate: string;
  totalRevenue?: number;
  averageOrderValue?: number;
  totalOrders?: number;
  totalItemsSold?: number;
}

interface AIChatContextType {
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  isFloatingOpen: boolean;
  setIsFloatingOpen: (open: boolean) => void;
  sendChatMessage: (message: string) => Promise<void>;
  resetChat: () => void;
  updateSummaryParams: (params: SummaryParams) => void;
  summaryParams: SummaryParams;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

const formatDateToDisplay = (dateInput: string | Date) => {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatCurrency = (value: number) => {
  return `${(value || 0).toLocaleString()} MMK`;
};

const GENERAL_GREETING = "Hello! I'm your AI Business Analyst. How can I help you optimize your inventory, analyze client accounts, or review transaction metrics today?";

export const AIChatProvider = ({ children }: { children: ReactNode }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  
  // Default summary parameters (current month)
  const [summaryParams, setSummaryParams] = useState<SummaryParams>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      summaryType: 'MONTHLY',
      periodStartDate: formatDate(firstDay),
      periodEndDate: formatDate(today)
    };
  });

  // Re-generate the welcome greeting whenever the parameters or data change,
  // but only if the user hasn't started talking yet (history length <= 1)
  const getGreetingText = useCallback((params: SummaryParams) => {
    if (params.totalRevenue !== undefined) {
      const startDisplay = formatDateToDisplay(params.periodStartDate);
      const endDisplay = formatDateToDisplay(params.periodEndDate);
      return `Hello! I'm your AI Business Analyst. I've analyzed the sales summary for the period from ${startDisplay} to ${endDisplay} (${params.summaryType}). During this period:\n\n` +
        `- **Total Revenue**: ${formatCurrency(params.totalRevenue || 0)}\n` +
        `- **Average Ticket**: ${formatCurrency(params.averageOrderValue || 0)}\n` +
        `- **Total Orders**: ${params.totalOrders || 0}\n` +
        `- **Items Dispatched**: ${params.totalItemsSold || 0} items\n\n` +
        `How can I help you analyze this data or optimize your inventory operations?`;
    }
    return GENERAL_GREETING;
  }, []);

  // Set initial greeting
  useEffect(() => {
    setChatMessages([
      { role: 'model', content: getGreetingText(summaryParams) }
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle updating params and potentially updating the greeting
  const updateSummaryParams = useCallback((params: SummaryParams) => {
    setSummaryParams(params);
    
    // Only update the greeting if the user has not chatted yet
    setChatMessages((prev) => {
      if (prev.length <= 1) {
        return [{ role: 'model', content: getGreetingText(params) }];
      }
      return prev;
    });
  }, [getGreetingText]);

  const sendChatMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: messageText };
    let currentMessages: ChatMessage[] = [];
    
    setChatMessages((prev) => {
      currentMessages = [...prev, userMsg];
      return currentMessages;
    });
    setChatLoading(true);

    try {
      const history = currentMessages.slice(0, -1).map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content
      }));

      const response = await api.post('/summary/chat', {
        message: messageText,
        summaryType: summaryParams.summaryType,
        periodStartDate: summaryParams.periodStartDate,
        periodEndDate: summaryParams.periodEndDate,
        history: history
      });

      if (response.data.isSuccess && response.data.data) {
        setChatMessages([...currentMessages, { role: 'model', content: response.data.data }]);
      } else {
        toast.error('Failed to get response from AI');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error contacting AI service');
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, summaryParams]);

  const resetChat = useCallback(() => {
    setChatMessages([
      { role: 'model', content: getGreetingText(summaryParams) }
    ]);
    toast.success('Chat history cleared');
  }, [getGreetingText, summaryParams]);

  return (
    <AIChatContext.Provider value={{
      chatMessages,
      chatLoading,
      isFloatingOpen,
      setIsFloatingOpen,
      sendChatMessage,
      resetChat,
      updateSummaryParams,
      summaryParams
    }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};
