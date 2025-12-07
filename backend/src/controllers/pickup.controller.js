const Pickup = require('../models/pickup.model');
const User = require('../models/user.model');

exports.createPickup = async (req, res) => {
  try {
    console.log('createPickup body:', req.body);
    const userId = req.userId;
    const { items, weightGrams, address, center } = req.body;

    // status will default to "pending" from the schema
    const pickup = new Pickup({
      user: userId,
      items,
      weightGrams,
      address,
      center,
    });

    await pickup.save();
    res.status(201).json(pickup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('center', 'name address');

    res.json(pickups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const pickup = await Pickup.findById(id);
    if (!pickup) {
      return res.status(404).json({ msg: 'Not found' });
    }

    // Allowed values must match frontend dropdown
    const allowedStatuses = [
      'pending',
      'approved',
      'assigned',
      'picked',
      'completed',
      'rejected',
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }

    if (status) {
      pickup.status = status; // frontend already sends lowercase
    }
    if (assignedTo) {
      pickup.assignedTo = assignedTo;
    }

    await pickup.save();

    // reward user automatically when marked completed
    if (pickup.status === 'completed') {
      const user = await User.findById(pickup.user);
      if (user) {
        user.points =
          (user.points || 0) + Math.round((pickup.weightGrams || 0) / 100);
        await user.save();
      }
    }

    res.json(pickup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
