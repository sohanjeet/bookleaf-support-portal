export type UserRole = 'author' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  city?: string;
  author_id?: string;
  joined_date?: string;
  created_at: string;
}

export interface Book {
  book_id: string;
  author_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TicketMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole | 'system';
  message: string;
  created_at: string;
}

export interface InternalNote {
  note_id: string;
  admin_id: string;
  admin_name: string;
  note: string;
  created_at: string;
}

export interface Ticket {
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  book_id: string | null;
  book_title: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  ai_category: TicketCategory;
  category_overridden: boolean;
  priority: TicketPriority;
  ai_priority: TicketPriority;
  priority_overridden: boolean;
  ai_priority_reasoning?: string;
  ai_draft_response?: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  internal_notes: InternalNote[];
}

export interface CreateTicketDTO {
  book_id?: string | null;
  subject: string;
  description: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
}

export interface UpdateTicketDTO {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
}

export interface AIClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  reasoning: string;
  draft_response: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider: 'openai' | 'anthropic' | 'gemini' | 'bookleaf-rule-engine';
}
