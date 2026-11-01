import express from 'express';
import { getAllBooks, getBookById, addBook } from '../controllers/book.controller.js';

import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Public route
router.get('/', getAllBooks);

// Protected routes
router.get('/:id', verifyToken, getBookById);
router.post('/', verifyToken, addBook);

export default router;
