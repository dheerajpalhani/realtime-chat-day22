import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Start Express Server
const server = app.listen(PORT, async () => {
  console.log(`Server Running on port ${PORT}`);
  
  // Connect to MongoDB
  await connectDB();
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
