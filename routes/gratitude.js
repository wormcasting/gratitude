const express = require('express');
const auth = require('../middleware/auth');
const Gratitude = require('../models/Gratitude');

const router = express.Router();

// CREATE / UPDATE Daily Gratitude (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const { date, items, win } = req.body;

    // 1. Validation
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one gratitude item is required' });
    }

    // 2. Upsert: Update if entry for user + date exists, otherwise create new
    const gratitude = await Gratitude.findOneAndUpdate(
      { userId: req.userId, date },
      { userId: req.userId, date, items, win: win || '' },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(gratitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user's own gratitudes (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const gratitudes = await Gratitude.find({ userId: req.userId }).sort({ date: -1 });
    res.json(gratitudes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single gratitude entry by Date (Protected)
router.get('/date/:date', auth, async (req, res) => {
  try {
    const gratitude = await Gratitude.findOne({ 
      userId: req.userId, 
      date: req.params.date 
    });

    if (!gratitude) {
      return res.status(404).json({ error: 'No entry found for this date' });
    }

    res.json(gratitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE gratitude entry (Protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const gratitude = await Gratitude.findById(req.params.id);

    if (!gratitude) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Verify ownership
    if (gratitude.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Gratitude.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gratitude entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;