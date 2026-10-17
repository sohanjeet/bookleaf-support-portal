import { Response } from 'express';
import { Ticket } from '../types/index.js';

interface ClientConnection {
  id: string;
  userId: string;
  role: string;
  authorId?: string;
  res: Response;
}

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
    const payload = JSON.stringify({
      event: eventType,
      ticket_id: ticket.ticket_id,
      ticket
    });

    for (const [_, client] of this.clients.entries()) {
      // Admins see all updates
      // Authors only see updates for their own tickets
      if (client.role === 'admin' || (client.authorId && client.authorId === ticket.author_id)) {
        try {
          client.res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
        } catch (err) {
          console.error(`Failed to send SSE to client ${client.id}:`, err);
        }
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
