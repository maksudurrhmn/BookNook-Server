import { MongoClient } from 'mongodb';

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);

    await client.connect();

    db = client.db(process.env.DB_NAME);

    await db.command({ ping: 1 });

    console.log('MongoDB connected successfully!');

    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database is not connected!');
  }

  return db;
};

export { connectDB, getDB };
