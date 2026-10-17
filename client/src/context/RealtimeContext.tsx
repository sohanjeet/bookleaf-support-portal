import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Ticket } from '../types';

type TicketEventHandler = (ticket: Ticket, eventType: string) => void;

interface RealtimeContextType {
  isConnected: boolean;
  subscribeToTickets: (handler: TicketEventHandler) => () => void;
  lastEvent: { eventType: string; ticket: Ticket } | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ eventType: string; ticket: Ticket } | null>(null);
  const handlersRef = useRef<Set<TicketEventHandler>>(new Set());

  useEffect(() => {
    if (!token || !user) {
      setIsConnected(false);
      return;
    }

    const eventSourceUrl = `/api/realtime/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    const handleMessageEvent = (eventType: string) => (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.ticket) {
          setLastEvent({ eventType, ticket: parsed.ticket });
          for (const handler of handlersRef.current) {
            handler(parsed.ticket, eventType);
          }
        }
      } catch (err) {
        console.error('Error handling SSE event:', err);
      }
    };

    eventSource.addEventListener('ticket_created', handleMessageEvent('ticket_created'));
    eventSource.addEventListener('ticket_updated', handleMessageEvent('ticket_updated'));
    eventSource.addEventListener('new_message', handleMessageEvent('new_message'));
    eventSource.addEventListener('internal_note_added', handleMessageEvent('internal_note_added'));

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [token, user]);

  const subscribeToTickets = (handler: TicketEventHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribeToTickets, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
