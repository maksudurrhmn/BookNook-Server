import express from 'express';

import { borrowBook, getMyBorrows, returnBook } from '../controllers/borrowController.js';

import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// All borrowing routes require authentication.
router.use(verifyToken);

router.post('/', borrowBook);
router.get('/', getMyBorrows);
router.delete('/:id', returnBook);

export default router;
