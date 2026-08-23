const mongoose = require('mongoose');

const GratitudeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: String, // Format: 'YYYY-MM-DD'
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
  },
  { timestamps: true }
);

// Ensures a user can only have one entry per date
GratitudeSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Gratitude', GratitudeSchema);