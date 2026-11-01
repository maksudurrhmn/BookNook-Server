import { MongoClient, ServerApiVersion } from 'mongodb';

let client;
let db;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    db = client.db(process.env.DB_NAME);

    await db.command({ ping: 1 });

    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database is not connected yet!');
  }

  return db;
};

export { connectDB, getDB };
