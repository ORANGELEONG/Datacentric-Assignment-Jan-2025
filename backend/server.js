require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// CORS configuration
app.use(cors());  // Simplified CORS for development

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'API is working' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5001;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Test the API at: http://localhost:${PORT}/test`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(console.error); 