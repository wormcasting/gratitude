require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gratitudeRoutes = require('./routes/gratitudes');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Connection error:', err));

// Middleware
app.use(express.json());

// --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://wormcasting.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle preflight OPTIONS checks
app.options('*', cors());
// ---------------------------------

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gratitudes', gratitudeRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🙏 Gratitude API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});