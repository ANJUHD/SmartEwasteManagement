const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      type: String
    }
  ],
  weightGrams: {
    type: Number,
    default: 0
  },
  address: {
    type: String
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'picked', 'completed', 'rejected'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pickup', PickupSchema);
