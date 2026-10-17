import { User, Book, Ticket, TicketStatus, TicketCategory, TicketPriority } from '../types';

const API_BASE = '/api';

/** Carries the HTTP status (when there was a response) so callers can tell auth failures from outages. */
export class ApiError extends Error {
  constructor(message: string, public status?: number, public timedOut = false) {
    super(message);
    this.name = 'ApiError';
  }
}

// Session restore must settle shortly after the loader's "Still connecting…" notice (8s).
const ME_TIMEOUT_MS = 10000;

type RequestOptions = RequestInit & { timeoutMs?: number };

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('bookleaf_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('bookleaf_token', token);
    } else {
      localStorage.removeItem('bookleaf_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('bookleaf_token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs, ...init } = options;
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const currentToken = this.getToken();
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Optional bounded wait (used for session restore) so a hung server cannot block the app forever.
    const controller = timeoutMs ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : 0;
    let response: Response;
    let data: any;
    try {
      response = await fetch(url, { ...init, headers, signal: controller?.signal ?? init.signal });
      data = await response.json().catch(() => ({}));
    } catch (err) {
      if (controller?.signal.aborted) throw new ApiError('The server took too long to respond.', undefined, true);
      throw err;
    } finally {
      if (timer) window.clearTimeout(timer);
    }

    if (!response.ok) {
      // Expired/invalid session on a protected call: drop the token and return to the login screen
      if (endpoint !== '/auth/login' && (response.status === 401 || data.error === 'InvalidToken')) {
        this.setToken(null);
        window.location.reload();
      }
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status);
    }

    return data;
  }

  // Auth Endpoints
  public async login(email: string, password = 'password123') {
    const res = await this.request<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.data.token);
    return res.data;
  }

  public async getMe() {
    return this.request<{ success: boolean; data: User }>('/auth/me', { timeoutMs: ME_TIMEOUT_MS });
  }

  public async getDemoAccounts() {
    return this.request<{ success: boolean; data: { admin: User; authors: any[] } }>('/auth/demo-accounts');
  }

  // Books
  public async getMyBooks(authorId?: string) {
    const query = authorId ? `?author_id=${authorId}` : '';
    return this.request<{ success: boolean; count: number; data: Book[] }>(`/books${query}`);
  }

  public async getBookById(id: string) {
    return this.request<{ success: boolean; data: Book }>(`/books/${id}`);
  }

  // Tickets
  public async getTickets(params?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; count: number; data: Ticket[] }>(`/tickets${qs}`);
  }

  public async getTicketById(id: string) {
    return this.request<{ success: boolean; data: Ticket }>(`/tickets/${id}`);
  }

  public async createTicket(formData: FormData) {
    return this.request<{ success: boolean; message: string; data: Ticket }>('/tickets', {
      method: 'POST',
      body: formData
    });
  }

  public async updateTicket(id: string, updates: Partial<Ticket>) {
    return this.request<{ success: boolean; message: string; data: Ticket }>(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async addMessage(ticketId: string, message: string) {
    return this.request<{ success: boolean; message: string; data: Ticket }>(`/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  public async addInternalNote(ticketId: string, note: string) {
    return this.request<{ success: boolean; message: string; data: Ticket }>(`/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
  }

  // AI Endpoints
  public async regenerateDraft(ticketId: string, toneInstruction?: string) {
    return this.request<{ success: boolean; data: { draft_response: string; ticket_id: string } }>('/ai/draft-response', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId, tone_instruction: toneInstruction })
    });
  }

  public async getKnowledgeBase() {
    return this.request<{ success: boolean; data: any }>('/ai/knowledge-base');
  }
}

export const api = new ApiService();
