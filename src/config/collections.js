import { getDB } from './db.js';

const initializeCollections = async () => {
  const db = getDB();

  const booksCollection = db.collection('books');
  const borrowsCollection = db.collection('borrows');

  // Books indexes
  await booksCollection.createIndex({ createdAt: -1 });

  await booksCollection.createIndex({
    'addedBy.userId': 1,
    createdAt: -1,
  });

  // Borrows indexes
  await borrowsCollection.createIndex({
    userId: 1,
    borrowDate: -1,
  });

  // Prevent the same user from borrowing
  // the same book more than once at a time.
  await borrowsCollection.createIndex({ bookId: 1, userId: 1 }, { unique: true });

  console.log('MongoDB collections and indexes initialized!');
};

export { initializeCollections };
