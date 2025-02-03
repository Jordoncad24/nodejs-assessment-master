const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config(); // Load environment variables from .env

// Import event-related routes
const eventRoutes = require('./routes/eventRoutes');

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Log HTTP requests

const { PORT, MONGODB_URI } = process.env;

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process on DB connection failure
  }
};

// Use imported routes
app.use('/api', eventRoutes); // Prefix all routes with /api

// Root route for API welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Event Ticketing System API');
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler for internal server errors
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ error: 'Something went wrong' });
});

// Start the server
const startServer = () => {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Error starting the server:', error);
      process.exit(1); // Exit on error
    });
};

startServer();
