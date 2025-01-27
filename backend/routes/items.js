const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Item = require('../models/item');

// Get all items for logged in user
// GET /api/items
router.get('/', protect, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user._id });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new item
// POST /api/items
router.post('/', protect, async (req, res) => {
  try {
    const { name, price, date } = req.body;

    const item = await Item.create({
      name,
      price,
      date,
      user: req.user._id
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update item
// PUT /api/items/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, price, date } = req.body;
    
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Verify item belongs to user
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update the item
    item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        date,
        user: req.user._id
      },
      { new: true, runValidators: true }
    );

    res.json(item);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete item
// DELETE /api/items/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Verify item belongs to user
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search items
// GET /api/items/search?name=keyword
router.get('/search', protect, async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      // If no search term, return all items
      const items = await Item.find({ user: req.user._id });
      return res.json(items);
    }

    const query = {
      user: req.user._id,
      name: { $regex: name, $options: 'i' } // Case-insensitive search
    };

    const items = await Item.find(query);
    res.json(items);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching items' });
  }
});

module.exports = router; 