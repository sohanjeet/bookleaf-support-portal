# Technical Approach & Architectural Write-Up
**Position:** Full-Stack Developer — BookLeaf Publishing  
**Project:** Author Support & Communication Portal  

---

### 1. Approach & Priorities

When designing the Author Support & Communication Portal for BookLeaf Publishing, my primary goal was to address the core operational bottleneck identified in the brief: **handling author inquiries at scale (1,200+ titles/month across 22,000+ books) without sacrificing empathy, consistency, or response time.**

To achieve this, I prioritised:
1. **Domain-Specific AI Integration over Generic LLM Wrappers:** Rather than passing unstructured text to a raw LLM prompt, I codified BookLeaf's actual operating rules (80/20 royalty split, net profit calculation formula, quarterly 45-day payment cycles, 48-hour ISBN resolution timelines, and 100% free reprint guarantees) into a dedicated Knowledge Base.
2. **Empathetic Brand Voice & Strict Tone Calibration:** Authors are creative partners, not transactional customers. The AI generation engine was calibrated directly against BookLeaf's sample queries, ensuring every draft acknowledges frustration first, includes concrete numbers (pending royalties, copies sold), avoids corporate deflection, and closes with a firm next step and timeline.
3. **Resilient Real-Time Updates & Responsive UX:** Handing communication at scale requires live visibility. I implemented Server-Sent Events (SSE) so authors and operations agents receive real-time updates as soon as tickets are classified, status changes, or responses are dispatched, without requiring disruptive page reloads.
4. **Seamless Reviewer Experience:** The application comes with a zero-friction "1-Click Evaluation Switcher" pre-seeded with all 10 authors and 18 books from `bookleaf_sample_data.json`, allowing anyone evaluating the project to immediately inspect live author dashboards and admin queues.

---

### 2. Key Trade-Offs Made

- **Server-Sent Events (SSE) vs. Full Duplex WebSockets:**  
  *Decision:* I chose Server-Sent Events (SSE) over WebSockets.  
  *Rationale:* The primary requirement was server-to-client streaming (notifying authors of admin replies and updating the queue). SSE runs over standard HTTP, traverses firewalls and proxies without custom handshakes, automatically reconnects, and has significantly lower connection overhead compared to stateful WebSocket clusters. Client messages are submitted via standard REST `POST` endpoints, preserving clean REST semantics.
- **File-Backed Persisted Store vs. External Postgres/Docker Setup:**  
  *Decision:* To ensure an effortless local setup for technical reviewers, I designed a thread-safe, file-backed ACID store seeded with all sample records rather than requiring reviewers to provision a local PostgreSQL or MongoDB instance. The data access layer is cleanly abstracted behind a repository interface (`Database`), making migration to Prisma/PostgreSQL straightforward.
- **Dual AI Engine (LLM + Knowledge-Base Fallback) vs. LLM-Only:**  
  *Decision:* External AI APIs can experience rate limits, network outages, or missing keys. I designed a dual-engine architecture: if a Groq key is configured, it leverages `openai/gpt-oss-120b`; if unconfigured or down, it gracefully degrades to the internal BookLeaf Knowledge-Base Heuristic Engine. This guarantees zero 500 errors and reliable classification under all conditions.

---

### 3. Evolving this System into an Enterprise Production System

Given the opportunity to transition this into a large-scale production deployment processing 1,200+ monthly titles, I would implement:
1. **Retrieval-Augmented Generation (RAG) with Vector Embeddings:** Replace heuristic slice retrieval with a vector database (e.g. `pgvector` or Pinecone) indexing the full library of BookLeaf author agreements, distribution partner contracts (Repro India, Epitome Books), and print error logs.
2. **Automated Asynchronous Queue (BullMQ / Redis):** Move AI classification and draft generation into background worker queues with exponential backoff and retry policies, decoupling user submission latency from LLM response times.
3. **Multi-Channel Author Ingestion (Omnichannel Support):** Connect the portal to incoming email webhooks (SendGrid Inbound Parse) and WhatsApp Business API, allowing authors to reply via email or chat while maintaining a unified thread inside the admin queue.
4. **Operations Analytics & SLA Monitoring:** Introduce dashboard telemetry tracking First Response Time (FRT), Mean Time to Resolution (MTTR), AI acceptance rate (how often admins send the AI draft without edits), and category distribution trends to proactively spot print partner defects.
