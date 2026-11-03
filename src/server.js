import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectDB, getDB } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('BookNook API is running!');
});

app.use('/books', bookRoutes);
app.use('/borrows', borrowRoutes);

const startServer = async () => {
  await connectDB();

  const db = getDB();

  await db.collection('borrows').createIndex(
    { bookId: 1, userId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: 'active' },
      name: 'unique_active_borrow_per_user_book',
    }
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
