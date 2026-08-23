const mongoose = require('mongoose');

const GratitudeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // e.g. "2026-08-24"
    required: true
  },
  items: {
    type: [String],
    required: true
  },
  win: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Prevent duplicate entries for the same user on the same date
GratitudeSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Gratitude', GratitudeSchema);
