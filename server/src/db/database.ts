import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Book, Ticket, TicketMessage, InternalNote, TicketStatus, TicketCategory, TicketPriority } from '../types/index.js';

interface DatabaseSchema {
  users: User[];
  books: Book[];
  tickets: Ticket[];
  last_seeded?: string;
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'src/data/db_store.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    books: [],
    tickets: []
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.error('Error loading database file, re-seeding:', err);
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public seedInitialData() {
    // Load sample data
    const sampleDataPath = path.resolve(process.cwd(), 'src/data/bookleaf_sample_data.json');
    let sampleData: any = { authors: [] };

    if (fs.existsSync(sampleDataPath)) {
      sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    const users: User[] = [];
    const books: Book[] = [];

    // 1. Create Admin Account
    users.push({
      id: 'USR_ADMIN_001',
      name: 'BookLeaf Ops Admin',
      email: 'admin@bookleafpub.com',
      password: defaultPasswordHash,
      role: 'admin',
      phone: '+91-11-2345-6789',
      city: 'Delhi',
      created_at: new Date('2022-01-01').toISOString()
    });

    // 2. Add Authors & their Books from sample data
    for (const author of sampleData.authors) {
      const user: User = {
        id: `USR_${author.author_id}`,
        name: author.name,
        email: author.email.toLowerCase(),
        password: defaultPasswordHash,
        role: 'author',
        phone: author.phone,
        city: author.city,
        author_id: author.author_id,
        joined_date: author.joined_date,
        created_at: new Date(author.joined_date || '2023-01-01').toISOString()
      };
      users.push(user);

      if (Array.isArray(author.books)) {
        for (const b of author.books) {
          books.push({
            book_id: b.book_id,
            author_id: author.author_id,
            title: b.title,
            isbn: b.isbn,
            genre: b.genre,
            publication_date: b.publication_date,
            status: b.status,
            mrp: b.mrp,
            author_royalty_per_copy: b.author_royalty_per_copy,
            total_copies_sold: b.total_copies_sold,
            total_royalty_earned: b.total_royalty_earned,
            royalty_paid: b.royalty_paid,
            royalty_pending: b.royalty_pending,
            last_royalty_payout_date: b.last_royalty_payout_date,
            print_partner: b.print_partner,
            available_on: b.available_on || []
          });
        }
      }
    }

    // 3. Pre-seed realistic tickets matching common scenarios and edge cases
    const tickets: Ticket[] = [
      {
        ticket_id: 'TCK-1001',
        author_id: 'AUTH003',
        author_name: 'Ananya Reddy',
        author_email: 'ananya.reddy@email.com',
        book_id: 'BK005',
        book_title: 'Between Two Temples',
        subject: 'Royalty payment pending for Q3 sales',
        description: 'Hello team, I published Between Two Temples in July and my dashboard shows 67 copies sold with ₹2,546 pending royalty. I haven’t received any payout yet. Could you please check when this will be credited?',
        status: 'Open',
        category: 'Royalty & Payments',
        ai_category: 'Royalty & Payments',
        category_overridden: false,
        priority: 'High',
        ai_priority: 'High',
        priority_overridden: false,
        ai_priority_reasoning: 'Financial query regarding overdue quarterly royalty payout above the ₹1,000 threshold.',
        ai_draft_response: `Dear Ananya,\n\nThank you for reaching out to BookLeaf Publishing. We completely understand your anticipation regarding your royalty payment for "Between Two Temples".\n\nTo explain our cycle: BookLeaf calculates royalties quarterly, and payouts are processed within 45 days after the quarter ends. Since your accumulated pending royalty is ₹2,546, it comfortably meets our ₹1,000 minimum threshold.\n\nOur team is currently verifying that your bank account details on your author profile are verified and up to date. We are escalating this to our finance desk immediately to confirm the transfer schedule within 48 hours.\n\nWarm regards,\nBookLeaf Author Support Team`,
        assigned_to: 'USR_ADMIN_001',
        assigned_to_name: 'BookLeaf Ops Admin',
        attachment_url: null,
        attachment_name: null,
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        messages: [
          {
            message_id: 'MSG-001',
            sender_id: 'USR_AUTH003',
            sender_name: 'Ananya Reddy',
            sender_role: 'author',
            message: 'Hello team, I published Between Two Temples in July and my dashboard shows 67 copies sold with ₹2,546 pending royalty. I haven’t received any payout yet. Could you please check when this will be credited?',
            created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
          }
        ],
        internal_notes: [
          {
            note_id: 'NOTE-001',
            admin_id: 'USR_ADMIN_001',
            admin_name: 'BookLeaf Ops Admin',
            note: 'Checked bank link status. Need to confirm with Finance team batch transfer #429.',
            created_at: new Date(Date.now() - 35 * 3600 * 1000).toISOString()
          }
        ]
      },
      {
        ticket_id: 'TCK-1002',
        author_id: 'AUTH007',
        author_name: 'Sneha Kulkarni',
        author_email: 'sneha.kulkarni@email.com',
        book_id: 'BK013',
        book_title: 'Midnight in Mysore',
        subject: 'Update on Cover Design stage for Midnight in Mysore',
        description: 'Hi BookLeaf, my thriller book Midnight in Mysore has been in the Cover Design stage for over 3 weeks now. Just checking if there are draft proofs ready for my review?',
        status: 'In Progress',
        category: 'Book Status & Production Updates',
        ai_category: 'Book Status & Production Updates',
        category_overridden: false,
        priority: 'Medium',
        ai_priority: 'Medium',
        priority_overridden: false,
        ai_priority_reasoning: 'In-production delay inquiry regarding cover approval workflow.',
        ai_draft_response: `Dear Sneha,\n\nThank you for following up on "Midnight in Mysore". We know how exciting it is to see the first visual identity of your thriller!\n\nCover design often involves fine-tuning typography and imagery to ensure high-impact presentation on Amazon and retail shelves. Our design team in Delhi has two concept drafts ready for your approval. You will receive the high-resolution proofs in your inbox within 24 hours.\n\nOnce you approve the cover, your manuscript will immediately transition to the Typesetting stage.\n\nBest regards,\nBookLeaf Production Team`,
        assigned_to: 'USR_ADMIN_001',
        assigned_to_name: 'BookLeaf Ops Admin',
        attachment_url: null,
        attachment_name: null,
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        messages: [
          {
            message_id: 'MSG-002',
            sender_id: 'USR_AUTH007',
            sender_name: 'Sneha Kulkarni',
            sender_role: 'author',
            message: 'Hi BookLeaf, my thriller book Midnight in Mysore has been in the Cover Design stage for over 3 weeks now. Just checking if there are draft proofs ready for my review?',
            created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
          },
          {
            message_id: 'MSG-003',
            sender_id: 'USR_ADMIN_001',
            sender_name: 'BookLeaf Ops Admin',
            sender_role: 'admin',
            message: 'Hello Sneha, our lead designer has finished two draft concepts and is doing final color calibration. We will send the PDF proofs to your registered email today by 6 PM IST!',
            created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
          }
        ],
        internal_notes: []
      },
      {
        ticket_id: 'TCK-1003',
        author_id: 'AUTH002',
        author_name: 'Rohit Kapoor',
        author_email: 'rohit.kapoor@email.com',
        book_id: 'BK004',
        book_title: 'Startup Sutra',
        subject: 'Amazon listing shows Currently Unavailable',
        description: 'Startup Sutra is showing "Currently Unavailable" on Amazon India today, even though it was live yesterday. Several readers have reported they cannot place orders. Please resolve this ASAP.',
        status: 'Open',
        category: 'Distribution & Availability',
        ai_category: 'Distribution & Availability',
        category_overridden: false,
        priority: 'Critical',
        ai_priority: 'Critical',
        priority_overridden: false,
        ai_priority_reasoning: 'Active bestselling title unavailable for purchase, causing immediate direct sales loss.',
        ai_draft_response: `Dear Rohit,\n\nWe apologize for this unexpected disruption with "Startup Sutra" on Amazon India. We understand how critical active listing availability is for your readers and sales momentum.\n\nThis is typically caused by an intermittent platform inventory sync glitch with Repro/In-House stock feeds. We have initiated a direct re-sync with the Amazon seller catalogue team immediately. In accordance with our standard protocol, the listing will be reinstated and active within 24 to 48 hours.\n\nOur operations lead is monitoring the listing directly and will update you as soon as the buy-box is back live.\n\nWarm regards,\nBookLeaf Distribution Team`,
        assigned_to: null,
        assigned_to_name: null,
        attachment_url: null,
        attachment_name: null,
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        messages: [
          {
            message_id: 'MSG-004',
            sender_id: 'USR_AUTH002',
            sender_name: 'Rohit Kapoor',
            sender_role: 'author',
            message: 'Startup Sutra is showing "Currently Unavailable" on Amazon India today, even though it was live yesterday. Several readers have reported they cannot place orders. Please resolve this ASAP.',
            created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
          }
        ],
        internal_notes: []
      }
    ];

    this.data = {
      users,
      books,
      tickets,
      last_seeded: new Date().toISOString()
    };

    this.persist();
    this.isLoaded = true;
    console.log(`Database initialized: ${users.length} users, ${books.length} books, ${tickets.length} tickets seeded.`);
  }

  // --- User Queries ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getAllAuthors(): User[] {
    return this.data.users.filter(u => u.role === 'author');
  }

  // --- Book Queries ---
  public getBooksByAuthorId(authorId: string): Book[] {
    return this.data.books.filter(b => b.author_id === authorId);
  }

  public getBookById(bookId: string): Book | undefined {
    return this.data.books.find(b => b.book_id === bookId);
  }

  public getAllBooks(): Book[] {
    return this.data.books;
  }

  // --- Ticket Queries ---
  public getTickets(filters?: {
    author_id?: string;
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    search?: string;
  }): Ticket[] {
    let list = [...this.data.tickets];

    if (filters?.author_id) {
      list = list.filter(t => t.author_id === filters.author_id);
    }
    if (filters?.status) {
      list = list.filter(t => t.status === filters.status);
    }
    if (filters?.category) {
      list = list.filter(t => t.category === filters.category);
    }
    if (filters?.priority) {
      list = list.filter(t => t.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        t =>
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.author_name.toLowerCase().includes(q) ||
          (t.book_title && t.book_title.toLowerCase().includes(q)) ||
          t.ticket_id.toLowerCase().includes(q)
      );
    }

    // Sort by priority rank (Critical > High > Medium > Low) then oldest unresolved
    const priorityWeights: Record<TicketPriority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1
    };

    list.sort((a, b) => {
      // Unresolved tickets come first
      const aResolved = a.status === 'Resolved' || a.status === 'Closed';
      const bResolved = b.status === 'Resolved' || b.status === 'Closed';
      if (aResolved !== bResolved) {
        return aResolved ? 1 : -1;
      }
      // Higher priority first
      const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      // Older first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return list;
  }

  public getTicketById(id: string): Ticket | undefined {
    return this.data.tickets.find(t => t.ticket_id === id);
  }

  public createTicket(ticket: Ticket): Ticket {
    this.data.tickets.unshift(ticket);
    this.persist();
    return ticket;
  }

  public updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket | undefined {
    const idx = this.data.tickets.findIndex(t => t.ticket_id === ticketId);
    if (idx === -1) return undefined;

    this.data.tickets[idx] = {
      ...this.data.tickets[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.persist();
    return this.data.tickets[idx];
  }

  public addMessage(ticketId: string, message: TicketMessage): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    ticket.messages.push(message);
    ticket.updated_at = new Date().toISOString();
    this.persist();
    return ticket;
  }

  public addInternalNote(ticketId: string, note: InternalNote): Ticket | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    ticket.internal_notes.push(note);
    ticket.updated_at = new Date().toISOString();
    this.persist();
    return ticket;
  }
}

export const db = new Database();
