import express from 'express';
import {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';

import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Public routes
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Protected routes
router.post('/', verifyToken, addBook);
router.patch('/:id', verifyToken, updateBook);
router.delete('/:id', verifyToken, deleteBook);

export default router;
