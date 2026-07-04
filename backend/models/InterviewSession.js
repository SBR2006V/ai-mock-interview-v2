const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  evaluation: {
    scores: {
      "Technical Accuracy": Number,
      "Communication": Number,
      "Confidence": Number,
      "Clarity": Number
    },
    strengths: String,
    improvements: String
  },
  fillerWordCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
