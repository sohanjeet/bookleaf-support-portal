import { Response } from 'express';
import { Ticket } from '../types/index.js';

interface ClientConnection {
  id: string;
  userId: string;
  role: string;
  authorId?: string;
  res: Response;
}

/** Strips admin-only data (internal notes, unsent AI draft, AI reasoning) from a ticket before it is shown to an author. */
export const toAuthorView = (ticket: Ticket): Ticket => {
  const { internal_notes, ai_draft_response, ai_priority_reasoning, ...rest } = ticket;
  return { ...rest, internal_notes: [], ai_draft_response: '', ai_priority_reasoning: '' } as Ticket;
};

class SSEService {
  private clients: Map<string, ClientConnection> = new Map();

  public addClient(id: string, userId: string, role: string, authorId: string | undefined, res: Response) {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client: ClientConnection = { id, userId, role, authorId, res };
    this.clients.set(id, client);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId: id })}\n\n`);

    res.on('close', () => {
      this.removeClient(id);
    });
  }

  public removeClient(id: string) {
    this.clients.delete(id);
  }

  public broadcastTicketUpdate(ticket: Ticket, eventType = 'ticket_updated') {
    const adminPayload = JSON.stringify({ event: eventType, ticket_id: ticket.ticket_id, ticket });
    const authorPayload = JSON.stringify({ event: eventType, ticket_id: ticket.ticket_id, ticket: toAuthorView(ticket) });

    for (const [_, client] of this.clients.entries()) {
      const isAdmin = client.role === 'admin';
      const isOwner = !!client.authorId && client.authorId === ticket.author_id;
      if (!isAdmin && !isOwner) continue;
      // Internal notes are admin-only: never push that event to authors
      if (!isAdmin && eventType === 'internal_note_added') continue;
      try {
        client.res.write(`event: ${eventType}
data: ${isAdmin ? adminPayload : authorPayload}

`);
      } catch (err) {
        console.error(`Failed to send SSE to client ${client.id}:`, err);
      }
    }
  }

  public broadcastNewTicket(ticket: Ticket) {
    this.broadcastTicketUpdate(ticket, 'ticket_created');
  }

  public broadcastNewMessage(ticket: Ticket) {
    this.broadcastTicketUpdate(ticket, 'new_message');
  }
}

export const sseService = new SSEService();
