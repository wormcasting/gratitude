const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_debugging';

// GET CURRENT USER (/api/auth/me)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user without returning the password
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: user._id, email: user.email });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // 2. Format email
    const cleanEmail = email.toLowerCase().trim();

    // 3. Check if user exists
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 4. Create new user
    user = new User({ email: cleanEmail, password });
    await user.save();

    // 5. Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('❌ Backend Signup Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;