import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

// POST /borrows
const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (typeof bookId !== 'string' || !ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid book ID is required',
      });
    }

    const db = getDB();
    const books = db.collection('books');
    const borrows = db.collection('borrows');

    const userId = String(req.user.id);
    const objectBookId = new ObjectId(bookId);

    // Prevent duplicate active borrowing.
    const existingBorrow = await borrows.findOne({
      bookId: objectBookId,
      userId,
      status: 'active',
    });

    if (existingBorrow) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active borrow for this book',
      });
    }

    // Atomically decrease available copies only if a copy is available.
    const updateResult = await books.updateOne(
      {
        _id: objectBookId,
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
        $set: { updatedAt: new Date() },
      }
    );

    if (updateResult.matchedCount === 0) {
      const bookExists = await books.findOne({ _id: objectBookId });

      return res.status(bookExists ? 409 : 404).json({
        success: false,
        message: bookExists ? 'This book is currently unavailable' : 'Book not found',
      });
    }

    try {
      const book = await books.findOne({ _id: objectBookId });

      if (!book) {
        throw new Error('Book not found after updating available copies');
      }

      const newBorrow = {
        bookId: objectBookId,
        userId,
        userName: req.user.name || '',
        bookTitle: book.title,
        bookImage: book.image,
        borrowedAt: new Date(),
        returnedAt: null,
        status: 'active',
      };

      const result = await borrows.insertOne(newBorrow);

      return res.status(201).json({
        success: true,
        message: 'Book borrowed successfully',
        data: {
          _id: result.insertedId,
          ...newBorrow,
        },
      });
    } catch (error) {
      // Restore the copy if creating the borrow record fails.
      await books.updateOne({ _id: objectBookId }, { $inc: { availableCopies: 1 } });

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active borrow for this book',
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Borrow book error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to borrow book',
    });
  }
};

// GET /borrows
const getMyBorrows = async (req, res) => {
  try {
    const db = getDB();

    const borrows = await db
      .collection('borrows')
      .find({ userId: String(req.user.id) })
      .sort({ borrowedAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: 'Borrowing history retrieved successfully',
      data: borrows,
    });
  } catch (error) {
    console.error('Get borrows error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve borrowing history',
    });
  }
};

// DELETE /borrows/:id
// Returning a book changes its status instead of deleting its history.
const returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid borrow ID',
      });
    }

    const db = getDB();
    const borrows = db.collection('borrows');
    const books = db.collection('books');

    // Only the owner can return their own active borrow.
    const borrow = await borrows.findOne({
      _id: new ObjectId(id),
      userId: String(req.user.id),
      status: 'active',
    });

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Active borrow not found',
      });
    }

    // Mark as returned only if it is still active.
    const result = await borrows.updateOne(
      {
        _id: borrow._id,
        userId: String(req.user.id),
        status: 'active',
      },
      {
        $set: {
          status: 'returned',
          returnedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: 'This book has already been returned',
      });
    }

    // Restore the available copy.
    let bookResult;

    try {
      bookResult = await books.updateOne({ _id: borrow.bookId }, { $inc: { availableCopies: 1 } });
    } catch (error) {
      // Restore the borrow status if updating the book fails.
      await borrows.updateOne(
        { _id: borrow._id, status: 'returned' },
        { $set: { status: 'active', returnedAt: null } }
      );

      throw error;
    }

    if (bookResult.matchedCount === 0) {
      // Restore the borrow status if its book record is missing.
      await borrows.updateOne(
        { _id: borrow._id, status: 'returned' },
        { $set: { status: 'active', returnedAt: null } }
      );

      return res.status(409).json({
        success: false,
        message: 'The original book record could not be found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully',
    });
  } catch (error) {
    console.error('Return book error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to return book',
    });
  }
};

export { borrowBook, getMyBorrows, returnBook };
