import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js';

const app = express();

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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
