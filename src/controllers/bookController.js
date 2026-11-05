import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

// GET /books
const getAllBooks = async (req, res) => {
  try {
    const db = getDB();

    const limit = Number.parseInt(req.query.limit, 10);
    const mine = req.query.mine === 'true';

    // Only return the authenticated user's books when mine=true.
    const filter = mine ? { 'addedBy.userId': String(req.user.id) } : {};

    let query = db
      .collection('books')
      .find(filter)
      .project({ 'addedBy.email': 0 })
      .sort({ createdAt: -1 });

    if (Number.isInteger(limit) && limit > 0) {
      query = query.limit(Math.min(limit, 50));
    }

    const books = await query.toArray();

    res.status(200).json({
      success: true,
      message: 'Books retrieved successfully',
      data: books,
    });
  } catch (error) {
    console.error('Get books error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
    });
  }
};

// GET /books/:id
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const db = getDB();

    const book = await db
      .collection('books')
      .findOne({ _id: new ObjectId(id) }, { projection: { 'addedBy.email': 0 } });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book retrieved successfully',
      data: book,
    });
  } catch (error) {
    console.error('Get book by ID error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
    });
  }
};

// POST /books
const addBook = async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body;

    const requiredFields = [title, author, category, image, description];

    if (
      requiredFields.some((field) => typeof field !== 'string' || !field.trim()) ||
      totalCopies === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate category
    const allowedCategories = ['Fiction', 'Science', 'History', 'Kids', 'Others'];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book category',
      });
    }

    // Validate total copies
    if (!Number.isInteger(Number(totalCopies)) || Number(totalCopies) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be a positive integer',
      });
    }

    // Validate image URL
    let imageUrl;

    try {
      imageUrl = new URL(image);

      if (!['http:', 'https:'].includes(imageUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid image URL',
      });
    }

    // Get authenticated user information
    // req.user will be provided by JWT middleware.
    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized user',
      });
    }

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),

      addedBy: {
        userId: String(req.user.id),
        name: req.user.name || '',
        email: req.user.email,
      },

      totalCopies: Number(totalCopies),
      availableCopies: Number(totalCopies),

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();

    const result = await db.collection('books').insertOne(newBook);

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: {
        _id: result.insertedId,
        ...newBook,
      },
    });
  } catch (error) {
    console.error('Add book error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add book',
    });
  }
};

// PATCH /books/:id
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const { title, author, category, image, description, totalCopies } = req.body;

    const allowedCategories = ['Fiction', 'Science', 'History', 'Kids', 'Others'];

    if (category !== undefined && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book category',
      });
    }

    const updatedData = {};

    const textFields = {
      title,
      author,
      image,
      description,
    };

    for (const [field, value] of Object.entries(textFields)) {
      if (value !== undefined) {
        if (typeof value !== 'string' || !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string`,
          });
        }
      }
    }

    let newTotalCopies;

    if (totalCopies !== undefined) {
      newTotalCopies = Number(totalCopies);

      if (!Number.isInteger(newTotalCopies) || newTotalCopies < 1) {
        return res.status(400).json({
          success: false,
          message: 'Total copies must be a positive integer',
        });
      }
    }

    const db = getDB();

    const existingBook = await db.collection('books').findOne({
      _id: new ObjectId(id),
      'addedBy.userId': String(req.user.id),
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or you are not authorized to update it',
      });
    }

    if (newTotalCopies !== undefined) {
      const borrowedCopies = existingBook.totalCopies - existingBook.availableCopies;

      if (newTotalCopies < borrowedCopies) {
        return res.status(400).json({
          success: false,
          message: `At least ${borrowedCopies} copies are currently borrowed`,
        });
      }

      updatedData.totalCopies = newTotalCopies;
      updatedData.availableCopies = newTotalCopies - borrowedCopies;
    }

    updatedData.updatedAt = new Date();

    const result = await db.collection('books').updateOne(
      {
        _id: new ObjectId(id),
        'addedBy.userId': String(req.user.id),
      },
      {
        $set: updatedData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or you are not authorized to update it',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
    });
  } catch (error) {
    console.error('Update book error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update book',
    });
  }
};

// DELETE /books/:id
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const db = getDB();
    const bookId = new ObjectId(id);

    const book = await db.collection('books').findOne({
      _id: bookId,
      'addedBy.userId': String(req.user.id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or you are not authorized to delete it',
      });
    }

    const activeBorrow = await db.collection('borrows').findOne({
      bookId,
      status: 'active',
    });

    if (activeBorrow) {
      return res.status(409).json({
        success: false,
        message: 'This book cannot be deleted while copies are borrowed',
      });
    }

    await db.collection('books').deleteOne({
      _id: bookId,
      'addedBy.userId': String(req.user.id),
    });

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete book',
    });
  }
};

export { getAllBooks, getBookById, addBook, updateBook, deleteBook };
