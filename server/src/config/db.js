import mongoose from 'mongoose';

/**
 * Connects to MongoDB database using the MONGODB_URI environment variable.
 * Gracefully handles connection failures by logging the error and exiting the process.
 * @returns {Promise<typeof mongoose>} Connection instance
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    const conn = await mongoose.connect(uri);
    console.log('MongoDB Connected');
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
