import './config.js'; // must stay first: loads .env and validates JWT_SECRET
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { aiService } from './services/aiService.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend applications
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attachments: authenticated, ownership-checked (not served statically)
app.use('/uploads', uploadRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BookLeaf Author Support & Communication API',
    version: '1.0.0',
    ai_status: aiService.isAIConfigured() ? 'Groq LLM configured' : 'Built-in BookLeaf Knowledge-Base AI active'
  });
});

// API Documentation summary endpoint
app.get('/api/docs', (_req, res) => {
  res.json({
    title: 'BookLeaf Author Support & Communication Portal API',
    version: '1.0.0',
    description: 'REST API powering the Author Portal, Admin Operations Portal, and AI-Assisted Support workflows.',
    authentication: 'Bearer <JWT_TOKEN>',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Authenticate with email & password',
        'GET /api/auth/me': 'Get current authenticated user profile',
        'GET /api/auth/demo-accounts': 'List test author and admin accounts for 1-click evaluation'
      },
      books: {
        'GET /api/books': 'List books (Authors see their own books; Admins see all or filter by ?author_id=...)',
        'GET /api/books/:id': 'Get detailed book statistics and status'
      },
      tickets: {
        'GET /api/tickets': 'Get tickets with filtering (?status, ?category, ?priority, ?search)',
        'GET /api/tickets/:id': 'Get ticket details with full message history',
        'POST /api/tickets': 'Submit new support ticket (triggers AI Auto-Classification & Draft)',
        'PATCH /api/tickets/:id': 'Update ticket status, assignee, or override AI category/priority (Admin only)',
        'POST /api/tickets/:id/messages': 'Post reply message to ticket conversation',
        'POST /api/tickets/:id/notes': 'Add private internal note (Admin only, hidden from authors)'
      },
      ai: {
        'POST /api/ai/draft-response': 'Regenerate tailored AI draft response with custom tone instructions (Admin only)',
        'GET /api/ai/knowledge-base': 'Inspect BookLeaf Knowledge Base and Tone Guidelines (Admin only)'
      },
      realtime: {
        'GET /api/realtime/stream?token=...': 'Server-Sent Events (SSE) live updates stream for real-time ticket sync'
      }
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/realtime', realtimeRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: 'The requested API route does not exist.'
  });
});

// Central Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` BookLeaf Author Support Portal API Server`);
  console.log(` Status: Running on http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` API Spec:     http://localhost:${PORT}/api/docs`);
  console.log(` AI Provider:  ${aiService.isAIConfigured() ? 'Groq LLM' : 'BookLeaf Knowledge-Base Local Engine'}`);
  console.log('====================================================');
});

export default app;
