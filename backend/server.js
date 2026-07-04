require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const interviewRoutes = require('./routes/interview');
app.use('/api/interview', interviewRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('InterviewAI Backend is running');
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_ai';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
