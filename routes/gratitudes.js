const express = require('express');
const auth = require('../middleware/auth');
const Gratitude = require('../models/Gratitude');

const router = express.Router();

// CREATE gratitude (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, isPrivate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const gratitude = new Gratitude({
      userId: req.userId,
      title,
      description,
      isPrivate: isPrivate !== false
    });

    await gratitude.save();
    res.json(gratitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user's own gratitudes (protected)
router.get('/', auth, async (req, res) => {
  try {
    const gratitudes = await Gratitude.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(gratitudes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single gratitude (only if it's yours)
router.get('/:id', auth, async (req, res) => {
  try {
    const gratitude = await Gratitude.findById(req.params.id);

    if (!gratitude) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check ownership
    if (gratitude.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(gratitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE gratitude (only if it's yours)
router.put('/:id', auth, async (req, res) => {
  try {
    let gratitude = await Gratitude.findById(req.params.id);

    if (!gratitude) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Verify ownership
    if (gratitude.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update fields
    if (req.body.title) gratitude.title = req.body.title;
    if (req.body.description) gratitude.description = req.body.description;
    if (req.body.isPrivate !== undefined) gratitude.isPrivate = req.body.isPrivate;

    await gratitude.save();
    res.json(gratitude);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE gratitude (only if it's yours)
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
    res.json({ message: 'Gratitude deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
