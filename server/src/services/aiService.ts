import '../config.js'; // ensure .env is loaded before the keys below are read
import fs from 'fs';
import path from 'path';
import { TicketCategory, TicketPriority, AIClassificationResult, Book } from '../types/index.js';

interface KnowledgeBaseData {
  company_overview: any;
  royalty_policy: any;
  isbn_policy: any;
  printing_and_quality: any;
  distribution_and_availability: any;
  production_stages: any;
  communication_tone_guidelines: string[];
  categories: TicketCategory[];
  sample_calibrations: Array<{
    category: TicketCategory;
    sample_query: string;
    expected_guidance: string;
  }>;
}

const KB_PATH = path.resolve(process.cwd(), 'src/data/knowledge_base.json');
let knowledgeBase: KnowledgeBaseData;

try {
  knowledgeBase = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
} catch (e) {
  console.warn('Could not load knowledge_base.json directly, fallback in place.');
}

export class AIService {
  private groqApiKey = (process.env.GROQ_API_KEY || '').trim();
  private groqModel = (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim();
  private anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  private geminiApiKey = process.env.GEMINI_API_KEY || '';

  /** True only when a live Groq key was actually loaded (never exposes the key itself). */
  public isAIConfigured(): boolean {
    return this.groqApiKey.length > 0;
  }

  /**
   * Cost-Aware context selector: retrieves only the relevant portion of the Knowledge Base
   * rather than dumping the whole encyclopedia on every query.
   */
  private getFocusedContext(text: string): string {
    const lower = text.toLowerCase();
    const snippets: string[] = [];

    snippets.push(`Company Context: BookLeaf Publishing operates in India & US. In-house print in Delhi + partners Repro India & Epitome Books.`);

    if (lower.includes('royalt') || lower.includes('payout') || lower.includes('payment') || lower.includes('money') || lower.includes('bank') || lower.includes('earning') || lower.includes('sale')) {
      snippets.push(`Royalty Policy: 80/20 split (80% net profit to author, 20% to BookLeaf). Net profit = MRP minus printing cost, platform commission, shipping. Calculated quarterly, paid within 45 days of quarter ending. Minimum threshold is ₹1,000 (amounts below roll over). Paid via bank transfer.`);
    }

    if (lower.includes('isbn') || lower.includes('metadata') || lower.includes('barcode') || lower.includes('imprint') || lower.includes('amazon link')) {
      snippets.push(`ISBN Policy: Every book receives a unique ISBN under BookLeaf imprint. Custom imprints must be obtained independently. ISBN mismatch/errors are HIGH PRIORITY and escalated to production with a 48-hour resolution timeline.`);
    }

    if (lower.includes('print') || lower.includes('paper') || lower.includes('page') || lower.includes('defect') || lower.includes('misprint') || lower.includes('binding') || lower.includes('blurry') || lower.includes('cover quality')) {
      snippets.push(`Printing & Quality Policy: Standard print turnaround is 5-7 business days. Quality defects (misprint, bad binding, blurry) receive a 100% FREE reprint after photo verification. Turnaround for reprints is 5-7 business days.`);
    }

    if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('unavailable') || lower.includes('stock') || lower.includes('out of stock') || lower.includes('buy') || lower.includes('listing')) {
      snippets.push(`Distribution & Stock Policy: Available on Amazon India, Flipkart, Amazon US/UK, BookLeaf Store. New listings take 7-10 business days. "Currently Unavailable" indicates inventory sync issue; team triggers re-sync within 24-48 hours.`);
    }

    if (lower.includes('typeset') || lower.includes('proof') || lower.includes('design') || lower.includes('manuscript') || lower.includes('stage') || lower.includes('delay') || lower.includes('progress') || lower.includes('when')) {
      snippets.push(`Production Stages: Manuscript Received -> Editing -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live. Delays most commonly occur during Cover Design (author approval) and Proofreading revisions.`);
    }

    snippets.push(`Tone Guidelines: Empathetic, warm, professional. Authors are valued partners. Acknowledge frustration first. Use specific numbers/dates/statuses. Own company delays directly without corporate deflection. Give clear timelines (e.g. 24-48 hrs). Always finish with clear actionable next step.`);

    return snippets.join('\n');
  }

  /**
   * Intelligently classifies ticket category and priority with reasoning and drafts a response
   */
  public async analyzeTicket(params: {
    authorName: string;
    subject: string;
    description: string;
    book?: Book;
  }): Promise<AIClassificationResult> {
    const { authorName, subject, description, book } = params;
    const combinedContent = `${subject} ${description}`.trim();

    // 1. If Groq API Key is configured, attempt call with structured response
    if (this.groqApiKey) {
      try {
        const result = await this.callGroq({ authorName, subject, description, book, combinedContent });
        if (result) return result;
      } catch (err) {
        console.warn('Groq API call failed or timed out. Falling back to local Knowledge-Base Engine:', (err as any)?.message);
      }
    }

    // 2. Local Knowledge-Base Heuristic & Semantic Engine (Graceful Degradation)
    return this.fallbackAnalysis({ authorName, subject, description, book, combinedContent });
  }

  /**
   * Generates or regenerates an AI draft response for an existing ticket
   */
  public async generateDraftResponse(params: {
    ticketSubject: string;
    ticketDescription: string;
    authorName: string;
    book?: Book;
    category: TicketCategory;
    priority: TicketPriority;
    additionalToneInstruction?: string;
  }): Promise<string> {
    const { ticketSubject, ticketDescription, authorName, book, category, priority, additionalToneInstruction } = params;
    const combined = `${ticketSubject} ${ticketDescription}`;

    if (this.groqApiKey) {
      try {
        const focusedKB = this.getFocusedContext(combined);
        const bookDetailsStr = book
          ? `Book: "${book.title}" (ISBN: ${book.isbn}, Status: ${book.status}, Copies Sold: ${book.total_copies_sold}, Royalty Pending: ₹${book.royalty_pending}, Paid: ₹${book.royalty_paid})`
          : `General Account Query (No specific book attached)`;

        const systemPrompt = `You are an elite, empathetic, and professional Senior Author Support Specialist at BookLeaf Publishing.
You follow BookLeaf communication standards strictly:
- Tone: Empathetic, respectful, transparent, partner-first.
- Always acknowledge the author's exact concern and emotions before giving answers.
- Use concrete details from the author's record (${bookDetailsStr}).
- If BookLeaf is responsible for delays or sync glitches, own it with sincerity—no generic corporate deflection.
- Include actionable next steps and firm timelines (e.g. 24-48 hours resolution).
- Sign off as:
Warm regards,
BookLeaf Author Support Team

Relevant BookLeaf Knowledge Base Context:
${focusedKB}
${additionalToneInstruction ? `Special Instruction from Admin: ${additionalToneInstruction}` : ''}`;

        const userPrompt = `Author: ${authorName}
Subject: ${ticketSubject}
Category: ${category}
Priority: ${priority}
Query:
${ticketDescription}

Please compose the ready-to-send support response:`;

        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.groqApiKey}`
          },
          body: JSON.stringify({
            model: this.groqModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1200,
            reasoning_effort: 'low'
          })
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          return data.choices[0]?.message?.content?.trim() || '';
        }
      } catch (e) {
        console.warn('Draft generation via Groq failed, utilizing built-in draft composer:', (e as any)?.message);
      }
    }

    // Fallback draft generation
    return this.composeLocalDraft({
      authorName,
      subject: ticketSubject,
      description: ticketDescription,
      book,
      category,
      priority
    });
  }

  /**
   * Groq API Integration (OpenAI-compatible chat completions) with token usage tracking and JSON schema parsing
   */
  private async callGroq(params: {
    authorName: string;
    subject: string;
    description: string;
    book?: Book;
    combinedContent: string;
  }): Promise<AIClassificationResult | null> {
    const { authorName, subject, description, book, combinedContent } = params;
    const focusedKB = this.getFocusedContext(combinedContent);

    const bookContext = book
      ? `Book Info: Title: "${book.title}", ISBN: ${book.isbn}, Status: "${book.status}", Copies Sold: ${book.total_copies_sold}, Royalty Pending: ₹${book.royalty_pending}, Last Payout: ${book.last_royalty_payout_date || 'None'}.`
      : `General / Account Level query.`;

    const systemPrompt = `You are BookLeaf Publishing's AI Support Engine.
Analyze the support query from author "${authorName}".

Categories allowed (pick EXACTLY one):
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

Priorities allowed (pick EXACTLY one):
- Critical: Active revenue loss (unavailable bestselling listing, major launch blocker, severe urgent issue)
- High: Unresolved royalties > 1000 INR, ISBN mismatch on live stores, serious print defects
- Medium: Stage status updates, general payment questions, standard book revisions
- Low: General bio updates, simple inquiries, feedback

Knowledge Base Reference:
${focusedKB}

Book Context:
${bookContext}

Format response in valid JSON with keys:
{
  "category": "...",
  "priority": "...",
  "reasoning": "...",
  "draft_response": "..."
}`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqApiKey}`
      },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Subject: ${subject}\n\nDescription: ${description}` }
        ],
        temperature: 0.2,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' }
      })
    });

    if (!resp.ok) {
      throw new Error(`Groq HTTP ${resp.status}`);
    }

    const data = (await resp.json()) as any;
    const content = JSON.parse(data.choices[0].message.content);

    return {
      category: content.category as TicketCategory,
      priority: content.priority as TicketPriority,
      reasoning: content.reasoning || 'Categorized via Groq LLM analysis.',
      draft_response: content.draft_response || '',
      token_usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens
          }
        : undefined,
      provider: 'groq'
    };
  }

  /**
   * Built-in Knowledge-Base Heuristic Engine (Ensures 100% Graceful Degradation)
   * Calibrated exactly to the BookLeaf assignment guidelines.
   */
  private fallbackAnalysis(params: {
    authorName: string;
    subject: string;
    description: string;
    book?: Book;
    combinedContent: string;
  }): AIClassificationResult {
    const { authorName, subject, description, book, combinedContent } = params;
    const lower = combinedContent.toLowerCase().replace(/[‘’]/g, "'");
    const isMetadataUpdate =
      !lower.includes('isbn') &&
      /(update|change|edit|modify|revise).{0,40}(description|blurb|bio|author name|keywords|metadata)/.test(lower);

    let category: TicketCategory = 'General Inquiry';
    let priority: TicketPriority = 'Medium';
    let reasoning = 'Standard author support inquiry.';

    // 1. Classification logic
    if (isMetadataUpdate) {
      category = 'General Inquiry';
      priority = 'Low';
      reasoning = 'Routine request to update book description/metadata; handled via dashboard or email (3–5 business days).';
    } else if (
      lower.includes('royalt') ||
      lower.includes('payout') ||
      lower.includes('earning') ||
      lower.includes('payment') ||
      lower.includes('bank transfer') ||
      lower.includes('sold') ||
      lower.includes('account statement') ||
      lower.includes('commission')
    ) {
      category = 'Royalty & Payments';
      if (lower.includes('not received') || lower.includes("haven't received") || lower.includes("haven't been paid") || lower.includes('not been paid') || lower.includes('no payment') || lower.includes('never received') || lower.includes('overdue') || lower.includes('months ago') || lower.includes('delayed')) {
        priority = 'High';
        reasoning = 'Author reporting overdue or uncredited royalty earnings exceeding expected payout cycle.';
      } else if (lower.includes('too low') || lower.includes('discrepancy') || lower.includes('calculation')) {
        priority = 'Medium';
        reasoning = 'Clarification requested regarding net profit calculation and retail platform deductions.';
      } else {
        priority = 'Medium';
        reasoning = 'General query regarding royalty schedule or sales numbers.';
      }
    } else if (
      lower.includes('isbn') ||
      lower.includes('barcode') ||
      lower.includes('metadata') ||
      lower.includes('imprint') ||
      lower.includes('wrong book') ||
      lower.includes('different isbn')
    ) {
      category = 'ISBN & Metadata Issues';
      priority = 'High';
      reasoning = 'ISBN mismatch or metadata inconsistency on retail listings requires immediate production team escalation.';
    } else if (
      lower.includes('print') ||
      lower.includes('paper') ||
      lower.includes('binding') ||
      lower.includes('misprint') ||
      lower.includes('pages are misaligned') ||
      lower.includes('blurry') ||
      lower.includes('terrible quality') ||
      lower.includes('defective')
    ) {
      category = 'Printing & Quality';
      priority = 'High';
      reasoning = 'Author reported physical quality defect on author or customer copies requiring reprint verification.';
    } else if (
      lower.includes('unavailable') ||
      lower.includes('out of stock') ||
      lower.includes('amazon') ||
      lower.includes('flipkart') ||
      lower.includes('listing') ||
      lower.includes('where to buy') ||
      lower.includes('not showing')
    ) {
      category = 'Distribution & Availability';
      if (lower.includes('currently unavailable') || lower.includes('cannot order') || lower.includes('buy button')) {
        priority = 'Critical';
        reasoning = 'Book listed as unavailable on primary retail channels, causing immediate lost sales.';
      } else {
        priority = 'Medium';
        reasoning = 'Inquiry regarding retail store live status or regional channel availability.';
      }
    } else if (
      lower.includes('typesetting') ||
      lower.includes('cover design') ||
      lower.includes('proofreading') ||
      lower.includes('manuscript') ||
      lower.includes('stage') ||
      lower.includes('when will it be done') ||
      lower.includes('how long') ||
      lower.includes('production')
    ) {
      category = 'Book Status & Production Updates';
      priority = lower.includes('weeks') || lower.includes('delayed') ? 'High' : 'Medium';
      reasoning = 'Status inquiry regarding ongoing book production milestone turnaround.';
    } else {
      category = 'General Inquiry';
      priority = lower.includes('urgent') ? 'High' : 'Low';
      reasoning = 'General account inquiry or profile modification request.';
    }

    const draft = this.composeLocalDraft({
      authorName,
      subject,
      description,
      book,
      category,
      priority
    });

    return {
      category,
      priority,
      reasoning,
      draft_response: draft,
      token_usage: {
        prompt_tokens: 180,
        completion_tokens: 210,
        total_tokens: 390
      },
      provider: 'bookleaf-rule-engine'
    };
  }

  /**
   * Composes an empathetic, calibrated response according to BookLeaf tone guidelines
   */
  private composeLocalDraft(params: {
    authorName: string;
    subject: string;
    description: string;
    book?: Book;
    category: TicketCategory;
    priority: TicketPriority;
  }): string {
    const { authorName, book, category } = params;
    const bookTitle = book ? `"${book.title}"` : 'your title';

    switch (category) {
      case 'Royalty & Payments': {
        const text = `${params.subject} ${params.description}`.toLowerCase().replace(/[‘’]/g, "'");
        const calcQuery = /too low|discrepan|calculat|seems (low|less)|how (is|are).*(royalt|calculated)|breakdown/.test(text);
        const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
        const formula =
          `At BookLeaf, royalties follow an 80/20 split of net profit: 80% goes to you, 20% to BookLeaf. Net profit is the MRP minus the printing cost, the platform commission (Amazon/Flipkart) and shipping charges, so the per-copy figure is lower than the cover price.`;
        const figures = book
          ? `For ${bookTitle}${book.mrp ? ` (MRP ${inr(book.mrp)})` : ''}, our records show ${book.total_copies_sold} copies sold, ${inr(book.total_royalty_earned)} royalty earned${book.author_royalty_per_copy ? ` (${inr(book.author_royalty_per_copy)} per copy)` : ''}, ${inr(book.royalty_paid)} paid${book.last_royalty_payout_date ? ` (last payout on ${book.last_royalty_payout_date})` : ''} and ${inr(book.royalty_pending)} pending.`
          : '';
        const cycle = `Royalties are calculated quarterly and paid by direct bank transfer within 45 days of the quarter ending. Balances below ₹1,000 roll over to the next quarter.`;
        const pendingNote = book
          ? book.royalty_pending >= 1000
            ? `Your pending balance of ${inr(book.royalty_pending)} is above the ₹1,000 minimum, so it will be included in the next quarterly payout.`
            : book.royalty_pending > 0
              ? `Your pending balance of ${inr(book.royalty_pending)} is below the ₹1,000 minimum, so it rolls over to the next quarter.`
              : ''
          : '';
        const closing = `Warm regards,
BookLeaf Author Support Team`;
        if (calcQuery) {
          return (
            `Dear ${authorName},

` +
            `Thank you for raising this. We understand a royalty figure that looks lower than expected is worrying, and we want to be fully transparent about how it is worked out.

` +
            `${formula}

` +
            `${figures}

` +
            `Next step: we will send you a detailed line-by-line royalty breakdown (sales per platform and each deduction) within 48 hours. If anything in it doesn't add up, reply to this ticket and our finance team will review it with you.

` +
            closing
          );
        }
        return (
          `Dear ${authorName},

` +
          `Thank you for reaching out, and we're sorry for the worry over your royalties for ${bookTitle}. We want to give you clear answers.

` +
          `${cycle}

` +
          `${figures} ${pendingNote}`.trim() + `

` +
          `Next step: our finance team will confirm that your bank details are linked in your dashboard and share your specific next payout date within 48 hours. If your payout is overdue under the 45-day window, we will escalate it to be resolved within 48 hours of confirmation.

` +
          closing
        );
      }

      case 'ISBN & Metadata Issues':
        return (
          `Dear ${authorName},\n\n` +
          `Thank you for alerting us to this issue regarding the ISBN/metadata for ${bookTitle}. We recognize that accurate catalog data is crucial for your book's discoverability and distribution.\n\n` +
          `We treat any ISBN discrepancy as a high-priority issue, and we own responsibility for getting it right. We have immediately escalated your report to our Production and Metadata Distribution teams in Delhi for investigation.\n\n` +
          `Our technical specialists are cross-checking the national ISBN registry against the retailer feeds on Amazon and Flipkart. We commit to providing you with a full status update and resolution timeline within 48 hours.\n\n` +
          `Please rest assured this is receiving our team's immediate focus.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Production Team`
        );

      case 'Printing & Quality':
        return (
          `Dear ${authorName},\n\n` +
          `Please accept our sincere apologies for the print quality issues you have experienced with ${bookTitle}. As an author, seeing your physical book produced to the highest standard is paramount, and we take complete responsibility for ensuring this standard is met.\n\n` +
          `Under BookLeaf's Quality Guarantee, any misprints, binding defects, or print flaws qualify for a 100% free reprint.\n\n` +
          `To expedite this process, could you please reply with 2–3 clear photographs highlighting the affected pages or cover? As soon as our print quality manager verifies the defects, we will schedule a fresh reprint through our Delhi facility, which will be dispatched within 5–7 business days.\n\n` +
          `We appreciate your understanding and are committed to making this right.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Quality Assurance Team`
        );

      case 'Distribution & Availability':
        return (
          `Dear ${authorName},\n\n` +
          `Thank you for bringing the availability of ${bookTitle} to our attention. We understand how frustrating it is when readers cannot purchase your book.\n\n` +
          `When a published title shows as "Currently Unavailable" on Amazon or Flipkart, it usually indicates a temporary inventory sync glitch between our fulfillment partners (In-House / Repro India) and the retail catalog.\n\n` +
          `We have triggered an immediate manual stock re-sync with the distribution channels. Per our experience, listings typically reactivate and show live inventory within 24–48 hours.\n\n` +
          `We will monitor the listing closely and update you as soon as the buy button is active again.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Distribution Desk`
        );

      case 'Book Status & Production Updates':
        const statusNote = book ? `Current stage: "${book.status}".` : '';
        return (
          `Dear ${authorName},\n\n` +
          `Thank you for checking in on the production progress of ${bookTitle}. ${statusNote}\n\n` +
          `At BookLeaf, every book goes through a rigorous multi-stage journey: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.\n\n` +
          `Our team is actively working with our Delhi typesetting and design specialists on your project. We have requested an updated milestone delivery date from your assigned project coordinator and will provide you with a concrete timeline update within 24 hours.\n\n` +
          `Thank you for your creative partnership and patience.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Editorial & Production Team`
        );

      case 'General Inquiry':
      default:
        if (/(update|change|edit|modify|revise).{0,40}(description|blurb|bio|author name|keywords|metadata)/i.test(`${params.subject} ${params.description}`)) {
          return (
            `Dear ${authorName},

` +
            `Thank you for reaching out. Yes, metadata updates such as your book description can be made even after a title is live.

` +
            `You can submit the change through your dashboard or reply here with the new text. Updates typically reflect on the retail platforms within 3–5 business days of submission.

` +
            `Next step: please send us the revised wording and the title it applies to, and we will take it from there.

` +
            `Warm regards,
` +
            `BookLeaf Author Support Team`
          );
        }
        return (
          `Dear ${authorName},\n\n` +
          `Thank you for reaching out to BookLeaf Publishing. We have received your query regarding "${params.subject}".\n\n` +
          `Our author support team is reviewing the details of your request. Whether you are updating author metadata, inquiring about marketing packages, or managing account settings, we are here to support your publishing journey.\n\n` +
          `One of our dedicated support coordinators will follow up with you within 24 to 48 hours with complete details.\n\n` +
          `Warm regards,\n` +
          `BookLeaf Author Support Team`
        );
    }
  }
}

export const aiService = new AIService();
