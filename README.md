# BookLeaf Author Support & Communication Portal

A full-stack web application for handling author support at BookLeaf Publishing. It provides an **Author Portal** (books, royalties, support tickets), an **Operations/Admin Portal** (triage queue, ticket management, Knowledge Base), and **AI-assisted triage and response drafting** that helps the operations team without replacing them.

Companion document: [WRITEUP.md](WRITEUP.md) (approach and trade-offs write-up).

## Contents

1. [Project overview](#1-project-overview)
2. [Key features](#2-key-features)
3. [AI-assisted support](#3-ai-assisted-support)
4. [Knowledge Base](#4-knowledge-base)
5. [Tech stack](#5-tech-stack)
6. [Architecture](#6-architecture)
7. [Project structure](#7-project-structure)
8. [Getting started](#8-getting-started)
9. [Demo accounts](#9-demo-accounts)
10. [Sample data](#10-sample-data)
11. [API overview](#11-api-overview)
12. [Authentication & authorization](#12-authentication--authorization)
13. [Realtime updates](#13-realtime-updates)
14. [Design / UX](#14-design--ux)
15. [Validation / testing](#15-validation--testing)
16. [Assumptions & trade-offs](#16-assumptions--trade-offs)
17. [Known limitations](#17-known-limitations)
18. [Production evolution](#18-production-evolution)
19. [AI tools used during development](#19-ai-tools-used-during-development)
20. [Submission notes](#20-submission-notes)

---

## 1. Project overview

Authors contact BookLeaf about royalties, ISBNs, print quality, listings and production status. Replies need to be fast, consistent and specific to the author's book. This application gives authors one place to raise and follow queries, and gives the operations team a prioritised queue with an AI-prepared starting point for every reply.

Implemented workflow:

```
Author raises a query (optionally linked to one of their books)
  -> ticket created (status: Open)
  -> AI assigns a category, a priority with reasoning, and a draft reply
  -> operations team sees it in the triage queue (live, via SSE)
  -> admin reviews, can override category/priority, assign, add internal notes
  -> admin edits the AI draft (or regenerates it with a tone instruction) and sends it
  -> ticket moves Open -> In Progress; author sees the reply live in the ticket thread
```

Nothing is sent to an author automatically. Closing a ticket is a manual admin action.

---

## 2. Key features

### Author Portal

- Email/password login (JWT).
- Dashboard with a royalty statement (earned / paid / pending totals).
- **My Books**: each title with status, ISBN, MRP, copies sold, royalty earned/paid/pending, last payout date, print partner and sales channels. Titles still in production (e.g. Cover Design, Typesetting) are listed with their stage.
- **Raise a query**: optional book selection (or "General"), subject, description, optional PNG/JPG/PDF attachment (max 10 MB).
- **My Tickets**: ticket history, status and category, conversation thread, and the ability to reply.
- Live updates when an admin replies or changes a ticket (no page refresh).
- Authors never receive internal notes, AI drafts or AI reasoning.

### Operations/Admin Portal

- **Triage queue**: status tabs, category and priority filters, text search (subject, description, author, book, ticket id), sorting (SLA/oldest-unresolved, newest, priority), summary counts for Critical/High/unresolved.
- **Ticket detail**: full conversation, book record (status, sales, royalty), attachment link.
- Status management (Open, In Progress, Resolved, Closed).
- Assignment: "assign to me" (the signed-in admin).
- Internal notes (admin only).
- AI category and priority (with reasoning) and manual override of both; the UI/API track whether a value was overridden.
- AI response draft: edit, revert, regenerate (optionally with a tone instruction or one of four presets), then send.
- **Knowledge Base** page: searchable view of BookLeaf policies and communication standards.
- **Books catalogue**: all books across authors with search and filters.
- Live queue updates when tickets are created, updated or replied to.

---

## 3. AI-assisted support

AI is implemented in [server/src/services/aiService.ts](server/src/services/aiService.ts).

| Concern | Implementation |
|---|---|
| Categorisation | On ticket creation, one OpenAI call (`gpt-4o-mini`, JSON mode, temperature 0.2) returns `category`, `priority`, `reasoning` and `draft_response`. Category is one of six fixed values. |
| Priority | The model is given a rubric: Critical = active revenue loss (e.g. bestselling title unavailable); High = unresolved royalties above ₹1,000, ISBN mismatch on live stores, serious print defects; Medium = status updates and standard questions; Low = bio/metadata edits and simple enquiries. The returned reasoning is shown to admins. |
| Draft generation | Part of the same call on creation. "Regenerate" in the ticket view calls `POST /api/ai/draft-response` (separate call, temperature 0.3, `max_tokens: 500`) and accepts an optional tone instruction. |
| Grounding | A compact set of Knowledge Base snippets is selected by keyword (royalty, ISBN, printing, distribution, production) and added to the system prompt, plus the tone guidelines. This keeps prompts small rather than sending the whole Knowledge Base on each call. |
| Context sent to the model | Author name, ticket subject and description, category/priority (regeneration only), the linked book's title, ISBN, status, copies sold, pending/paid royalty and last payout date, the selected policy snippets, and any admin tone instruction. No emails, phone numbers or credentials are sent. |
| Human control | AI output is a suggestion. Admins can override category and priority, edit or revert the draft, regenerate it, or write a reply from scratch. The draft is labelled "Unsent" and is only delivered when the admin clicks send. |
| When AI is unavailable | If no key is configured, or the call fails, times out (15 s) or returns a non-2xx response, the server falls back to a built-in keyword rule engine and template drafts that use the same book data and Knowledge Base values. Ticket creation does not fail because of AI. |
| API key handling | Read from the server environment only. It is never sent to the browser and `server/.env` is git-ignored. |

Things to know:

- **Only OpenAI is wired up.** `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` and `AI_PROVIDER` appear in `.env.example` but are not used by the code.
- **The OpenAI key must be present in the shell environment, not only in `server/.env`.** `dotenv.config()` runs after the AI service module has read `process.env`, so a key that exists only in `server/.env` is not picked up (verified). See [Environment variables](#environment-variables).
- Model output for category/priority is parsed from JSON but not validated against the allowed values before it is stored; admins can correct it with the override controls.
- The policy snippets used in prompts are written into `aiService.ts`; `knowledge_base.json` is what the Knowledge Base page and `GET /api/ai/knowledge-base` display. The two should be kept in sync if policies change.
- Token usage returned by OpenAI is captured in the service result but is not persisted or logged.

---

## 4. Knowledge Base

The Knowledge Base is [server/src/data/knowledge_base.json](server/src/data/knowledge_base.json), built from the BookLeaf operational information supplied with the assignment. It is shown to admins on the Knowledge Base page (`GET /api/ai/knowledge-base`) with six areas:

- Royalty & Payments (80/20 net-profit split, quarterly cycle, 45-day payment, ₹1,000 minimum)
- ISBN & Metadata (ISBN assignment, custom imprint, 48-hour error escalation)
- Printing & Quality (fulfilment, 5–7 business day turnaround, free reprint for defects)
- Distribution & Availability (platforms, listing turnaround, stock-sync recovery)
- Production Updates (stage flow and common delay points)
- Communication Guidelines (tone guidelines and sample response calibrations)

The same policies drive the AI: keyword-selected snippets ground the OpenAI prompts, and the fallback engine's templates use the same figures (see the notes in [section 3](#3-ai-assisted-support)).

---

## 5. Tech stack

Versions are the ranges declared in the `package.json` files.

| Layer | Technology |
|------|------------|
| Frontend | React `^18.3.1`, Vite `^6.1.0` |
| Backend | Node.js, Express `^4.21.2` (run with `tsx`) |
| Language | TypeScript `^5.7.3` (client and server) |
| Storage | JSON file (`server/src/data/db_store.json`) behind a small data-access class; uploads on local disk (`server/uploads/`) |
| Authentication | JWT (`jsonwebtoken`), passwords hashed with `bcryptjs`, role-based middleware |
| AI | OpenAI Chat Completions (`gpt-4o-mini`) via `fetch`, with a local rule-based fallback |
| Realtime | Server-Sent Events (native `EventSource` on the client) |
| Animation/UI | Framer Motion `^14.3.0`, GSAP `^3.15.0`, Lucide icons, hand-written CSS |
| Uploads | `multer` |

Node and npm: development and checks were run on Node v24.19.0 / npm 10.4.0. No `engines` field is declared.

---

## 6. Architecture

```
Browser
  React SPA (Vite dev server :5173)
     |  REST (JSON, Bearer JWT)          |  SSE  GET /api/realtime/stream
     |  /api and /uploads proxied        |
     v                                   v
Express API (:5000)
  routes -> auth + role middleware -> controllers
                                          |
              +---------------------------+-----------------------+
              |                           |                       |
        db_store.json              aiService                sseService
        (users, books,             - OpenAI (optional)      - connected clients
         tickets)                  - rule-based fallback    - per-role payloads
        uploads/ (files)
```

- **Frontend**: single-page app with role-based views (author vs admin), an API client ([client/src/services/api.ts](client/src/services/api.ts)), an auth context and a realtime context. In development Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so no client environment variables are needed.
- **Backend**: Express routes grouped by area (auth, books, tickets, ai, realtime); controllers hold the business rules; services wrap AI and SSE.
- **Auth/RBAC**: JWT verification middleware plus `requireRole`; ownership checks live in the controllers (see [section 12](#12-authentication--authorization)).
- **AI layer**: described in [section 3](#3-ai-assisted-support).
- **Persistence**: the whole dataset is loaded into memory at start-up and written back to the JSON file after each change.
- **Realtime**: ticket mutations call `sseService`, which pushes the event to connected admins and to the ticket's owning author only.

---

## 7. Project structure

```
bookleaf-support-portal/
├── client/
│   ├── src/
│   │   ├── animation/       GSAP setup and shell entrance
│   │   ├── components/      Navbar, AIDraftBox, NewTicketModal, badges, loader
│   │   ├── context/         AuthContext, RealtimeContext (SSE)
│   │   ├── pages/
│   │   │   ├── author/      Dashboard, My Books, My Tickets
│   │   │   └── admin/       Ticket queue, ticket detail, Knowledge Base, books catalogue
│   │   ├── services/api.ts  REST client
│   │   └── types/
│   ├── vite.config.ts       dev server port 5173 + API proxy
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/     auth, books, tickets, ai
│   │   ├── routes/          auth, books, tickets, ai, realtime
│   │   ├── middleware/      auth (JWT), rbac, errorHandler
│   │   ├── services/        aiService, sseService
│   │   ├── db/database.ts   JSON-file store and seeding
│   │   ├── data/            bookleaf_sample_data.json, knowledge_base.json, db_store.json
│   │   └── index.ts         app entry (port 5000)
│   ├── .env.example
│   └── package.json
├── run-dev.js               starts server and client together
├── package.json             root convenience scripts
├── WRITEUP.md
└── README.md
```

`bookleaf_sample_data.json` lives at `server/src/data/bookleaf_sample_data.json`.

---

## 8. Getting started

### Prerequisites

- Node.js and npm (tested on Node v24.19.0 / npm 10.4.0).
- An OpenAI API key is **optional**. Without it the app runs fully using the built-in fallback engine.

### Installation

```bash
git clone <repository-url>
cd bookleaf-support-portal
npm run setup            # runs npm install in server/ and client/
```

Or install each part manually:

```bash
cd server && npm install
cd ../client && npm install
```

### Environment variables

Copy the example file (it is safe to run without changes):

```bash
cp server/.env.example server/.env      # Windows PowerShell: Copy-Item server\.env.example server\.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port. Default `5000`. The Vite proxy targets `http://localhost:5000`, so keep the default unless you also change `client/vite.config.ts`. |
| `JWT_SECRET` | No (set for any non-local use) | Secret used to sign JWTs. Falls back to a built-in development default. |
| `NODE_ENV` | No | Listed in `.env.example`; not read by the code. |
| `OPENAI_API_KEY` | No | Enables live OpenAI calls. Without it the fallback engine is used. |
| `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER` | No | Listed in `.env.example` but **not used** by the code. |

Placeholder for local use only; never commit a real key:

```
OPENAI_API_KEY=your_api_key_here
```

**Known quirk:** because `dotenv` loads after the AI service reads its key, set the key in the shell that starts the server instead of (or as well as) `server/.env`:

```bash
# bash
OPENAI_API_KEY=your_api_key_here npm run dev
# PowerShell
$env:OPENAI_API_KEY = "your_api_key_here"; npm run dev
```

The same load order applies to `JWT_SECRET`, so a value that exists only in `server/.env` is not applied either (the default is used). This is harmless locally because the `.env.example` value equals the built-in default.

### Running the application

Both processes must be running. The simplest way, from the repository root:

```bash
npm run dev
```

This runs `run-dev.js`, which starts the server (`tsx watch`) and the Vite client together. To run them separately:

```bash
# Terminal 1 - API
cd server
npm run dev          # tsx watch src/index.ts   (npm start runs without file watching)

# Terminal 2 - client
cd client
npm run dev          # vite --port 5173 --host
```

Run the server from inside `server/` (or via the root scripts): data and sample-data paths are resolved relative to the current directory.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |
| Endpoint summary (JSON) | http://localhost:5000/api/docs |

Open http://localhost:5173 and sign in with a demo account.

---

## 9. Demo accounts

These are intentional demo credentials for reviewers, created from the sample data. All accounts share the password **`password123`**.

### Admin

- Email: `admin@bookleafpub.com`
- Password: `password123`

### Author

- Email: `priya.sharma@email.com` (AUTH001)
- Password: `password123`

Other authors follow the pattern from the sample data (`rohit.kapoor@email.com`, `ananya.reddy@email.com`, `sneha.kulkarni@email.com`, `kavita.deshmukh@email.com`, and so on; all ten are listed in `server/src/data/bookleaf_sample_data.json`). Useful scenarios:

| Author | Scenario |
|--------|----------|
| Rohit Kapoor (AUTH002) | Has a seeded Critical ticket: Amazon listing "Currently Unavailable" |
| Ananya Reddy (AUTH003) | Seeded High royalty ticket (pending royalty, nothing paid yet) |
| Sneha Kulkarni (AUTH007) | Seeded ticket about a title stuck in Cover Design |

The app also includes an **"Evaluation mode"** bar that switches between the admin and any author in one click (it signs in with the demo password). This exists for review convenience and is not meant for production (see [limitations](#17-known-limitations)).

---

## 10. Sample data

[server/src/data/bookleaf_sample_data.json](server/src/data/bookleaf_sample_data.json) contains **10 authors and 18 books**.

- Seeding is **automatic on first start**: if `server/src/data/db_store.json` does not exist, the server builds it from the sample data (one admin, 10 author users, 18 books, 3 example tickets).
- If `db_store.json` already exists it is loaded as-is. The file is committed in this repository and is updated at runtime, so it also contains any tickets created during local use.
- **To reset to a clean seed**: stop the server, delete `server/src/data/db_store.json`, start the server again.
- The `seed` npm scripts (`npm run seed`, root and server) point to `src/data/seed.ts`, which does not exist in the repository, so they do not work. Use the reset procedure above.

---

## 11. API overview

All routes are under `/api`. "Auth" means `Authorization: Bearer <token>`. A machine-readable summary is served at `GET /api/docs`; route definitions are in [server/src/routes/](server/src/routes/).

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| **Authentication** | | | |
| POST | `/auth/login` | Public | Email + password, returns JWT and profile |
| GET | `/auth/me` | Auth | Current user |
| GET | `/auth/demo-accounts` | Public | Demo account list (used by the evaluation bar) |
| **Books** | | | |
| GET | `/books` | Auth | Author: own books. Admin: all, or `?author_id=` |
| GET | `/books/:id` | Auth | Book detail; authors only for their own books |
| **Tickets** | | | |
| GET | `/tickets` | Auth | List with `status`, `category`, `priority`, `search` filters; authors see only their own, sanitised |
| GET | `/tickets/:id` | Auth | Ticket and thread; owner or admin |
| POST | `/tickets` | Auth | Create ticket (multipart, optional `attachment`); runs AI analysis |
| PATCH | `/tickets/:id` | Admin | Update status, category, priority, assignee |
| POST | `/tickets/:id/messages` | Auth | Add reply; owner or admin. Admin reply moves Open to In Progress |
| POST | `/tickets/:id/notes` | Admin | Add internal note |
| **AI** | | | |
| POST | `/ai/draft-response` | Admin | Regenerate draft for `ticket_id` with optional `tone_instruction` |
| GET | `/ai/knowledge-base` | Admin | Knowledge Base JSON |
| **Realtime** | | | |
| GET | `/realtime/stream?token=<jwt>` | Auth | SSE stream |
| **Other** | | | |
| GET | `/health`, `/docs` | Public | Health check, endpoint summary |
| GET | `/uploads/<file>` | Public | Static uploaded attachments |

---

## 12. Authentication & authorization

- **Login**: `POST /api/auth/login` checks the bcrypt hash and returns a JWT (7-day expiry) carrying user id, name, email, role and `authorId`.
- **Session**: the client keeps the token in `localStorage` and sends it as a Bearer header. On a 401/invalid-token response the client drops the token and returns to the login screen.
- **Roles**: `author` and `admin`. `authenticateJWT` verifies the token on every protected route; `requireRole(['admin'])` guards ticket updates, internal notes and the AI endpoints.
- **Author isolation** (enforced server-side, using `authorId` from the verified token, never from request input):
  - `GET /tickets` is filtered to the caller's `author_id`.
  - `GET /tickets/:id` and `POST /tickets/:id/messages` return 403 for another author's ticket.
  - `GET /books` returns only the caller's books and `GET /books/:id` returns 403 for another author's book.
  - `POST /tickets` rejects a `book_id` that belongs to another author.
  - Ticket responses to authors pass through `toAuthorView`, which removes internal notes, the AI draft and AI reasoning. The same sanitised view is used for SSE events.
- Not implemented: refresh tokens, token revocation, login rate limiting, password change, CSRF-style protections beyond the Bearer-header model.

---

## 13. Realtime updates

The client opens an `EventSource` to `/api/realtime/stream?token=<jwt>` after login. SSE was chosen because updates only flow server to client (client actions use normal REST calls), it works over plain HTTP and proxies, and the browser reconnects automatically.

- Events: `ticket_created`, `ticket_updated`, `new_message`, `internal_note_added`.
- Admins receive every event with the full ticket. An author receives events only for their own tickets, in sanitised form, and never `internal_note_added`.
- The server sends a heartbeat comment every 25 seconds. The sidebar shows "Live sync" or "Reconnecting".
- Reconnection is the browser's built-in `EventSource` behaviour. Events missed while disconnected are not replayed (no event ids); pages fetch current data when they load.
- The EventSource API cannot set headers, so the token is passed as a query parameter.

---

## 14. Design / UX

- Editorial BookLeaf visual identity (BookLeaf mark, loader, Newsreader serif headings with Inter UI text) with separate layouts for the author experience and the denser operations workspace (table-based queue, ticket detail with side panels).
- Responsive layout, including a navigation drawer on small screens.
- Accessibility work includes ARIA labels/roles on key controls and a labelled live-sync status; this has not been audited with automated tooling.
- Reduced motion: Framer Motion is wrapped in `MotionConfig reducedMotion="user"`, GSAP animations check `prefers-reduced-motion`, and `index.css` has a reduced-motion media query.
- Framer Motion is used for UI transitions; GSAP drives the entrance/loader animations.

---

## 15. Validation / testing

There is **no automated test suite** (no test runner or test files). Validation is type-checking and build only.

| Area | Command (run from the directory shown) | Notes |
|------|----------------------------------------|-------|
| Client type-check | `cd client && npx tsc --noEmit` | Passes |
| Client build | `cd client && npm run build` | Runs `tsc && vite build`; passes (Vite warns about a chunk over 500 kB) |
| Server type-check | `cd server && npx tsc --noEmit` | Passes |
| Server build | `cd server && npm run build` | `tsc` to `server/dist`. Not needed to run the app: `npm start` and `npm run dev` execute `src/` through `tsx` |

Manual checks used during development: the author/admin flows in the browser, plus direct API calls for the role and ownership rules.

---

## 16. Assumptions & trade-offs

- **JSON-file persistence** so a reviewer needs no database. All access goes through the `Database` class in `server/src/db/database.ts`, which is the seam for a real database later.
- **Seed data is committed.** `db_store.json` ships in the repository so the app starts with the sample authors, books and three example tickets.
- **SSE over WebSockets**: traffic is one-directional; see [section 13](#13-realtime-updates).
- **AI is assistive, not autonomous.** It classifies, scores and drafts; a human decides what is sent. Failures degrade to a rule engine rather than blocking ticket creation.
- **Cost control**: one call per new ticket, one per regeneration, `gpt-4o-mini`, keyword-selected snippets instead of the full Knowledge Base, bounded output on regeneration.
- **Attachments are stored locally** (`server/uploads/`, git-ignored). The ticket stores the file path and original name; admins see a link on the ticket detail page. Authors' ticket views do not render the attachment.
- **Demo-oriented authentication**: one shared demo password, an unauthenticated demo-accounts endpoint and a one-click switcher, all to make review quick.
- **Local-only deployment**: there is no Dockerfile, hosting configuration or CI in the repository.

---

## 17. Known limitations

- Single-process JSON storage: whole-file synchronous writes on every change, no transactions, not suitable for concurrent multi-instance use. The data file is tracked in git and changes as the app is used.
- SSE connections are held in process memory, so realtime works for a single server instance only; no replay of missed events.
- `.env` loading order means `OPENAI_API_KEY` / `JWT_SECRET` should be provided via the shell environment (see [Environment variables](#environment-variables)). The `/api/health` and start-up banner report OpenAI as active whenever the variable is set at request time, which can differ from what the AI service actually read.
- `npm run seed` is broken (missing `seed.ts`); reset by deleting `db_store.json`.
- Only OpenAI is integrated; unused provider variables remain in `.env.example`. Model category/priority output is not validated before storing.
- Uploaded files are served from `/uploads/<random-name>` without authentication (names are not guessable but are not access-controlled) and are not virus-scanned. Allowed types are PNG, JPG and PDF, max 10 MB.
- Authentication is demo-grade: shared password, token in `localStorage`, no revocation or rate limiting, permissive CORS (`origin: true`), SSE token in the query string, development-default JWT secret fallback.
- Assignment is "assign to me" only; there is no assignee picker or multi-admin directory.
- No automated tests.
- Ticket ids are random four-digit numbers (`TCK-NNNN`) without a uniqueness check.

---

## 18. Production evolution

Future improvements, **not implemented**:

- PostgreSQL (with migrations and transactions) replacing the JSON store; an object store (e.g. S3-compatible) with signed URLs for attachments.
- Redis pub/sub or a durable event stream so SSE works across multiple instances and supports replay.
- A background job queue for AI calls with retries, plus caching and per-request logging of token usage and cost.
- Retrieval over the full Knowledge Base (embeddings) instead of keyword-selected snippets; evaluation of AI category/priority accuracy and draft acceptance rate.
- Stronger auth: individual credentials, refresh/revocation, rate limiting, SSO for staff, secrets via a secrets manager, tighter CORS.
- Observability (structured logs, metrics, tracing), automated tests and CI, containerised deployment.
- Outbound email notifications on admin replies.

---

## 19. AI tools used during development

AI-assisted development tools (Claude Code) were used for implementation support, refactoring, UI review and debugging, including this README. Generated changes were reviewed and checked with the type-checks and build described above. The repository also contains local agent skill folders (`.agent/`, `.agents/`, `.claude/`, `.cursor/`, `.gemini/`, `.codex/`) from those tools; they are not part of the application.

---

## 20. Submission notes

- **Repository status**: no remote is configured in the local clone; add the public repository URL before submitting. Local working-tree changes may be uncommitted.
- **How to run**: `npm run setup`, then `npm run dev`; open http://localhost:5173 and sign in as `admin@bookleafpub.com` or `priya.sharma@email.com` with `password123`. No API key is required.
- **Assumptions and trade-offs**: [section 16](#16-assumptions--trade-offs); limitations in [section 17](#17-known-limitations); the longer write-up is [WRITEUP.md](WRITEUP.md).
- **For reviewers**: to see live OpenAI output, start the server with `OPENAI_API_KEY` set in the shell (see [Environment variables](#environment-variables)); otherwise the labelled fallback engine produces the classification and drafts. To reset the data, delete `server/src/data/db_store.json` and restart.
