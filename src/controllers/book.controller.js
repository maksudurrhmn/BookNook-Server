import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

// GET /books
const getAllBooks = async (req, res) => {
  try {
    const db = getDB();

    const limit = Number.parseInt(req.query.limit, 10);

    let query = db.collection('books').find().sort({ createdAt: -1 });

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
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid book ID',
    });
  }

  const db = getDB();

  const book = await db.collection('books').findOne({
    _id: new ObjectId(id),
  });

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Book retrieved successfully',
    data: book,
  });
};

// POST /books
const addBook = async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body;

    // Validate required fields
    if (!title || !author || !category || !image || !description || totalCopies === undefined) {
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
    // req.user will be provided by our JWT middleware.
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

export { getAllBooks, getBookById, addBook };
