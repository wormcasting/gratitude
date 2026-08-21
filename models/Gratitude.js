const mongoose = require('mongoose');

const gratitudeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  description: { 
    type: String,
    maxlength: 1000
  },
  isPrivate: { 
    type: Boolean, 
    default: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gratitude', gratitudeSchema);