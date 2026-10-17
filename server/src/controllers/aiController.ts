import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { aiService } from '../services/aiService.js';
import { db } from '../db/database.js';

const KB_PATH = path.resolve(process.cwd(), 'src/data/knowledge_base.json');

export const generateDraftResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticket_id, tone_instruction } = req.body;

    if (!ticket_id) {
      res.status(400).json({ success: false, message: 'ticket_id is required' });
      return;
    }

    const ticket = db.getTicketById(ticket_id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    let book;
    if (ticket.book_id) {
      book = db.getBookById(ticket.book_id);
    }

    const draft = await aiService.generateDraftResponse({
      ticketSubject: ticket.subject,
      ticketDescription: ticket.description,
      authorName: ticket.author_name,
      book,
      category: ticket.category,
      priority: ticket.priority,
      additionalToneInstruction: tone_instruction
    });

    // Update ticket's current draft response
    db.updateTicket(ticket_id, { ai_draft_response: draft });

    res.json({
      success: true,
      data: {
        draft_response: draft,
        ticket_id
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'AIDraftError', message: err.message });
  }
};

export const getKnowledgeBase = (_req: Request, res: Response): void => {
  try {
    if (fs.existsSync(KB_PATH)) {
      const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
      res.json({ success: true, data: kb });
    } else {
      res.status(404).json({ success: false, message: 'Knowledge base file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
