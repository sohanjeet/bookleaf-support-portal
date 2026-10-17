# BookLeaf Publishing — Author Support & Communication Portal

An intelligent, full-stack Author Support & Communication Portal built for **BookLeaf Publishing**. This solution solves author communication at scale (processing 1,200+ monthly titles across a 22,000+ book catalog) with **two unified interfaces** (Author-facing & Admin-facing) powered by an **AI-assisted response generation engine** that strictly follows BookLeaf's Knowledge Base, royalty policies, production SLAs, and empathetic tone guidelines.

---

## 🚀 Key Highlights & Architecture

- **Author Portal (Author-Facing)**:
  - Email/Password authentication with role-based access control.
  - **My Books**: Comprehensive dashboard displaying published and in-production titles with MRP, copies sold, royalty earned, royalty paid, pending payout balances, and retail distribution channels. Gracefully handles edge cases (books in cover design/typesetting, zero sales, zero payouts).
  - **Submit Query**: Form with linked book dropdown (or "General / Account Level"), subject, detailed description, and optional file attachment dropzone.
  - **My Tickets**: Live ticket tracker with conversation threads, admin responses, status badges, and **real-time updates via Server-Sent Events (SSE)** without needing page refreshes.
- **Admin Operations Portal (Admin-Facing)**:
  - **Prioritized Ticket Queue**: Sortable and filterable by status (`Open`, `In Progress`, `Resolved`, `Closed`), category, priority (`Critical`, `High`, `Medium`, `Low`), and date/search. Highlights urgent and oldest unresolved tickets.
  - **AI Auto-Classification**: Automatically categorizes incoming queries into:
    - *Royalty & Payments*
    - *ISBN & Metadata Issues*
    - *Printing & Quality*
    - *Distribution & Availability*
    - *Book Status & Production Updates*
    - *General Inquiry*
    (Admins can override the classification at any time).
  - **AI Priority Scoring**: Evaluates content severity with explanatory reasoning (e.g. Amazon listings marked unavailable are flagged `Critical`; royalty payouts > ₹1,000 flagged `High`).
  - **AI-Drafted Response Generator**: Pre-populates a ready-to-edit response referencing the author's exact book sales, royalty balance, and BookLeaf company policies. Includes 1-click tone calibration buttons (e.g., *Empathetic & 48h Escalation*, *Net Profit Formula*, *Free Reprint Offer*, *Amazon 24-48h Re-Sync*).
  - **Ticket Management**: Update status, assign tickets to operations specialists, and add **Internal Notes** (strictly confidential and never exposed to authors).
- **1-Click Reviewer Evaluation Switcher**:
  - A fixed evaluation bar at the top of the interface enables reviewers to switch between the **Admin Operations Account** and all **10 Seeded Sample Authors** instantly with one click.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript | Fast HMR, type safety, modular component hierarchy |
| **Styling** | Vanilla CSS Design System | Custom dark theme inspired by modern publishing aesthetics (Plus Jakarta Sans & Inter, glassmorphism, responsive micro-animations) |
| **Icons** | Lucide React | Clean, modern iconography |
| **Backend** | Node.js, Express, TypeScript | RESTful API design, modular controller/service architecture |
| **Real-Time** | Server-Sent Events (SSE) | Native HTTP streaming, automatic reconnection, low overhead, proxy-friendly |
| **Persistence** | File-backed ACID Data Store | Zero external database installation required for reviewers; pre-seeded with all 10 authors, 18 books, and initial tickets out of the box |
| **AI Engine** | OpenAI `gpt-4o-mini` + Knowledge-Base Fallback Engine | High reasoning capability, cost-conscious token usage, and 100% graceful degradation if API keys are not supplied |

---

## 📦 Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended; verified on Node v24)
- npm (v9 or higher)

### 1. Installation
Clone the repository and run the setup script:

```bash
# From the project root
npm run setup
```
*(This installs dependencies for both `server` and `client`)*

### 2. Configuration (Optional)
The backend includes a `.env` file pre-configured with default development secrets.

If you have an OpenAI API key and wish to test live LLM calls:
1. Open `server/.env`
2. Add your key: `OPENAI_API_KEY=sk-...`

> **Note on Graceful Degradation:** If `OPENAI_API_KEY` is left blank, the application **automatically uses its built-in BookLeaf Knowledge-Base Heuristic & Semantic Engine**. It analyzes queries, scores priority, and drafts empathetic responses following the exact guidelines and calibrations without crashing or throwing errors!

### 3. Run the Application
Start both the backend server and frontend development client concurrently:

```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **API Specification:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔑 Test Login Credentials

All accounts are pre-seeded with the default password: `password123`.
You can also use the **1-Click Switcher Ribbon** at the top of the application to switch instantly without typing.

| Role | Name | Email | Scenario & Seeded Data |
| :--- | :--- | :--- | :--- |
| **Admin** | BookLeaf Ops Admin | `admin@bookleafpub.com` | Operations dashboard, full queue, AI drafting & override tools |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | 2 Live books (*Whispers of the Ganges*, *The Saffron Diaries*), ₹3,570 pending royalty |
| **Author** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | Bestseller (*Startup Sutra* — 1,203 copies sold), active distribution inquiry |
| **Author** | Ananya Reddy (`AUTH003`) | `ananya.reddy@email.com` | Edge case: Published title with ₹2,546 pending royalty, 0 paid yet |
| **Author** | Sneha Kulkarni (`AUTH007`)| `sneha.kulkarni@email.com`| Edge case: *Midnight in Mysore* currently in **Cover Design** production stage |
| **Author** | Kavita Deshmukh (`AUTH009`)| `kavita.deshmukh@email.com`| Edge case: *Raising Roots* in **Typesetting** stage |
| **Authors**| All 10 Authors from `bookleaf_sample_data.json` | `[firstname].[lastname]@email.com` | All 18 books loaded |

---

## 🧠 AI Integration Details

### 1. Prompt Engineering & Tone Calibration
The system incorporates BookLeaf's explicit communication guidelines:
- **Empathetic & Partner-First:** Acknowledges the author's frustration first before presenting resolutions.
- **Specifics Over Fluff:** Injects actual book titles, royalty amounts, sales counts, and turnaround timelines.
- **Ownership of Errors:** Acknowledges company delays directly (e.g., catalog sync issues) with zero corporate deflection.
- **Commitment Timelines:** Promises clear SLAs (e.g. "within 48 hours" or "5–7 business days for reprints").

### 2. Cost Awareness & Selective Context Retrieval
Rather than sending the entire knowledge base history on every API call:
- The system extracts only relevant policy slices (e.g. only injecting royalty formulas when financial keywords are detected, or printing guarantees when defect terms appear).
- Strict output bounding (`max_tokens: 500`) and low temperature (`0.2–0.3`) for deterministic and structured responses.
- Token metrics are logged with each transaction.

### 3. Graceful Degradation & High Availability
- If the AI API experiences rate limits, network timeouts, or if no API key is supplied, the system falls back seamlessly to the **BookLeaf Knowledge-Base Heuristic Engine**.
- Tickets are **always** created successfully, auto-classified, prioritized, and given a baseline response draft.

### 4. Model Choice Justification
- **Primary:** OpenAI `gpt-4o-mini` (or Claude 3.5 Haiku) was selected because customer support classification and drafted email generation require moderate reasoning, high instruction-following fidelity, and fast turnaround at low token costs ($0.15 / 1M input tokens).
- **Fallback:** Deterministic local rule engine ensuring zero dependencies and 100% test reliability.

---

## 📡 REST API Reference

All protected endpoints require the header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
- `POST /api/auth/login` — Log in with email and password. Returns JWT token and user profile.
- `GET /api/auth/me` — Retrieve currently authenticated user.
- `GET /api/auth/demo-accounts` — List pre-seeded accounts for evaluation.

### Books
- `GET /api/books` — Authors receive their own books; Admins receive all catalog titles (or filter via `?author_id=...`).
- `GET /api/books/:id` — Detailed book record.

### Tickets
- `GET /api/tickets` — Query tickets with optional filters (`?status=...&category=...&priority=...&search=...`). Authors only receive their own tickets without internal notes.
- `GET /api/tickets/:id` — Retrieve full conversation and metadata.
- `POST /api/tickets` — Create a new ticket (triggers AI auto-classification and priority scoring). Supports multipart file uploads.
- `PATCH /api/tickets/:id` — (Admin only) Update status, override AI category/priority, or update assignee.
- `POST /api/tickets/:id/messages` — Post a message in the ticket thread (sent to author or admin).
- `POST /api/tickets/:id/notes` — (Admin only) Add confidential internal note.

### AI Assistance
- `POST /api/ai/draft-response` — (Admin only) Re-draft response with custom tone instructions.
- `GET /api/ai/knowledge-base` — (Admin only) Inspect codified company policies and sample calibrations.

### Real-Time Streaming
- `GET /api/realtime/stream?token=<JWT>` — Server-Sent Events (SSE) stream for live updates (`ticket_created`, `ticket_updated`, `new_message`, `internal_note_added`).

---

## 🛡️ Known Limitations & Future Roadmap

1. **Email / SMS Notification Gateway:** Integrating SendGrid or Amazon SES to send outbound email notifications when an admin replies.
2. **Vector Embeddings (RAG):** Migrating from focused keyword extraction to pgvector / ChromaDB embeddings to query hundreds of internal BookLeaf SOPs.
3. **Automated Auto-Resolve Timers:** Automatically transitioning resolved tickets to `Closed` if the author does not respond within 7 days.
4. **Rich Multi-channel Chat:** Supporting WhatsApp Business API for authors who prefer messaging over web portals.
