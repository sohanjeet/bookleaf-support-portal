import { Request, Response } from 'express';
import { db } from '../db/database.js';

export const getMyBooks = (req: Request, res: Response): void => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (user.role === 'author') {
      if (!user.authorId) {
        res.status(400).json({ success: false, message: 'No author ID associated with this user' });
        return;
      }
      const books = db.getBooksByAuthorId(user.authorId);
      res.json({ success: true, count: books.length, data: books });
      return;
    }

    // Admins can view all books or filter by author_id query param
    const { author_id } = req.query;
    if (author_id && typeof author_id === 'string') {
      const books = db.getBooksByAuthorId(author_id);
      res.json({ success: true, count: books.length, data: books });
      return;
    }

    const allBooks = db.getAllBooks();
    res.json({ success: true, count: allBooks.length, data: allBooks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'BookFetchError', message: err.message });
  }
};

export const getBookDetails = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const book = db.getBookById(id);

    if (!book) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    // RBAC: author can only access their own book
    if (req.user?.role === 'author' && book.author_id !== req.user.authorId) {
      res.status(403).json({ success: false, message: 'Access denied: You do not own this book record' });
      return;
    }

    res.json({ success: true, data: book });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'BookFetchError', message: err.message });
  }
};
