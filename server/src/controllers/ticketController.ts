import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { aiService } from '../services/aiService.js';
import { sseService, toAuthorView } from '../services/sseService.js';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, TicketMessage, InternalNote } from '../types/index.js';

const STATUSES: readonly string[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORIES: readonly string[] = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];
const PRIORITIES: readonly string[] = ['Critical', 'High', 'Medium', 'Low'];

export const getTickets = (req: Request, res: Response): void => {
  try {
    const user = req.user!;
    const { status, category, priority, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status as TicketStatus;
    if (category) filters.category = category as TicketCategory;
    if (priority) filters.priority = priority as TicketPriority;
    if (search) filters.search = String(search);

    // If author, restrict to only their tickets
    if (user.role === 'author') {
      filters.author_id = user.authorId;
    }

    let tickets = db.getTickets(filters);

    // Security/Privacy: Authors MUST NOT see internal notes or internal admin metadata
    if (user.role === 'author') {
      tickets = tickets.map(toAuthorView);
    }

    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TicketFetchError', message: err.message });
  }
};

export const getTicketById = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const ticket = db.getTicketById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    // RBAC: author can only view their own ticket
    if (user.role === 'author' && ticket.author_id !== user.authorId) {
      res.status(403).json({ success: false, message: 'Access denied: You do not own this ticket.' });
      return;
    }

    // Strip internal notes if author
    if (user.role === 'author') {
      res.json({ success: true, data: toAuthorView(ticket) });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TicketFetchError', message: err.message });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { book_id, subject, description } = req.body;

    if (!subject || !subject.trim()) {
      res.status(400).json({ success: false, error: 'ValidationError', message: 'Subject line is required.' });
      return;
    }
    if (!description || !description.trim()) {
      res.status(400).json({ success: false, error: 'ValidationError', message: 'Detailed description is required.' });
      return;
    }

    let book;
    if (book_id && book_id !== 'general') {
      book = db.getBookById(book_id);
      if (!book) {
        res.status(400).json({ success: false, error: 'ValidationError', message: 'Selected book does not exist.' });
        return;
      }
      if (user.role === 'author' && book.author_id !== user.authorId) {
        res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied: You do not own this book.' });
        return;
      }
    }

    const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. AI Auto-Classification, Priority Scoring, and Draft Response Generation
    const aiAnalysis = await aiService.analyzeTicket({
      authorName: user.name,
      subject: subject.trim(),
      description: description.trim(),
      book
    });

    const newTicket: Ticket = {
      ticket_id: ticketId,
      author_id: user.authorId || user.userId,
      author_name: user.name,
      author_email: user.email,
      book_id: book ? book.book_id : null,
      book_title: book ? book.title : null,
      subject: subject.trim(),
      description: description.trim(),
      status: 'Open',
      category: aiAnalysis.category,
      ai_category: aiAnalysis.category,
      category_overridden: false,
      priority: aiAnalysis.priority,
      ai_priority: aiAnalysis.priority,
      priority_overridden: false,
      ai_priority_reasoning: aiAnalysis.reasoning,
      ai_draft_response: aiAnalysis.draft_response,
      assigned_to: null,
      assigned_to_name: null,
      attachment_url: req.file ? `/uploads/${req.file.filename}` : null,
      attachment_name: req.file ? req.file.originalname : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          message_id: `MSG-${Date.now()}-1`,
          sender_id: user.userId,
          sender_name: user.name,
          sender_role: user.role,
          message: description.trim(),
          created_at: new Date().toISOString()
        }
      ],
      internal_notes: []
    };

    const created = db.createTicket(newTicket);

    // Broadcast real-time event to connected admins
    sseService.broadcastNewTicket(created);

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully.',
      data: user.role === 'author' ? toAuthorView(created) : created
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TicketCreateError', message: err.message });
  }
};

export const updateTicket = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const ticket = db.getTicketById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    const { status, category, priority, assigned_to, assigned_to_name } = req.body;
    const updates: Partial<Ticket> = {};

    const invalid = (field: string, allowed: readonly string[]) => {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `Invalid ${field}. Allowed values: ${allowed.join(', ')}.`
      });
    };
    if (status && !STATUSES.includes(status)) return invalid('status', STATUSES);
    if (category && !CATEGORIES.includes(category)) return invalid('category', CATEGORIES);
    if (priority && !PRIORITIES.includes(priority)) return invalid('priority', PRIORITIES);

    if (status) updates.status = status;

    if (category) {
      updates.category = category;
      updates.category_overridden = category !== ticket.ai_category;
    }

    if (priority) {
      updates.priority = priority;
      updates.priority_overridden = priority !== ticket.ai_priority;
    }

    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to;
      updates.assigned_to_name = assigned_to_name || (assigned_to ? user.name : null);
    }

    const updated = db.updateTicket(id, updates);
    if (updated) {
      sseService.broadcastTicketUpdate(updated);
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully.',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TicketUpdateError', message: err.message });
  }
};

export const addMessage = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message content is required.' });
      return;
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    // RBAC: author can only reply to their own ticket
    if (user.role === 'author' && ticket.author_id !== user.authorId) {
      res.status(403).json({ success: false, message: 'Access denied: You do not own this ticket.' });
      return;
    }

    const newMessage: TicketMessage = {
      message_id: `MSG-${Date.now()}`,
      sender_id: user.userId,
      sender_name: user.name,
      sender_role: user.role,
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    // If admin replies and ticket was open, automatically update status to In Progress
    const statusUpdate = user.role === 'admin' && ticket.status === 'Open' ? 'In Progress' : ticket.status;

    db.updateTicket(id, { status: statusUpdate });
    const updated = db.addMessage(id, newMessage);

    if (updated) {
      sseService.broadcastNewMessage(updated);
    }

    res.json({
      success: true,
      message: 'Message sent successfully.',
      data: updated && user.role === 'author' ? toAuthorView(updated) : updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'MessageAddError', message: err.message });
  }
};

export const addInternalNote = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
      return;
    }

    const newNote: InternalNote = {
      note_id: `NOTE-${Date.now()}`,
      admin_id: user.userId,
      admin_name: user.name,
      note: note.trim(),
      created_at: new Date().toISOString()
    };

    const updated = db.addInternalNote(id, newNote);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    // Internal notes are only broadcast to admins
    sseService.broadcastTicketUpdate(updated, 'internal_note_added');

    res.json({
      success: true,
      message: 'Internal note added.',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'InternalNoteError', message: err.message });
  }
};
