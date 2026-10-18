import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET } from '../config.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Email address is required.'
      });
      return;
    }

    const user = db.getUserByEmail(String(email).trim());
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'No account found with this email address.'
      });
      return;
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Password is required.'
      });
      return;
    }

    const match = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!match) {
      res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password. (Default demo password is: password123)'
      });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authorId: user.author_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          author_id: user.author_id,
          phone: user.phone,
          city: user.city,
          joined_date: user.joined_date
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'LoginError',
      message: error.message || 'Error occurred during login.'
    });
  }
};

export const getMe = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = db.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      author_id: user.author_id,
      phone: user.phone,
      city: user.city,
      joined_date: user.joined_date
    }
  });
};

export const getDemoAccounts = (_req: Request, res: Response): void => {
  const authors = db.getAllAuthors().map(a => ({
    id: a.id,
    author_id: a.author_id,
    name: a.name,
    email: a.email,
    role: a.role,
    books_count: db.getBooksByAuthorId(a.author_id || '').length
  }));

  const admin = {
    id: 'USR_ADMIN_001',
    name: 'BookLeaf Ops Admin',
    email: 'admin@bookleafpub.com',
    role: 'admin'
  };

  res.json({
    success: true,
    data: {
      admin,
      authors
    }
  });
};
