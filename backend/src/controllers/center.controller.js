const Center = require('../models/center.model');

exports.createCenter = async (req, res) => {
  try {
    const c = new Center(req.body);
    await c.save();
    res.json(c);
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};

exports.listCenters = async (req, res) => {
  try {
    const { city } = req.query;
    const query = {};
    // if city filter provided, do a case-insensitive match on address or city field
    if (city) {
      query.$or = [
        { address: new RegExp(city, 'i') }
      ];
    }

    // Exclude centers that have invalid coordinates like [0,0]
    query['location.coordinates'] = { $ne: [0, 0] };

    const centers = await Center.find(query);
    res.json(centers);
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};

// Get nearest centers by coordinates
exports.getNearestCenters = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ msg: 'Latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Create a 2dsphere index if it doesn't exist
    await Center.collection.createIndex({ 'location': '2dsphere' });

    // Find centers near the given coordinates
    const centers = await Center.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(10);

    res.json(centers);
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};

// Calculate distance between two coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get nearest centers with calculated distance (simplified version)
exports.getNearestCentersByDistance = async (req, res) => {
  try {
    const { latitude, longitude, limit = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ msg: 'Latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Get all centers (exclude invalid [0,0] coordinates)
    const centers = await Center.find({ 'location.coordinates': { $ne: [0, 0] } });

    // Calculate distances and sort
    const centersWithDistance = centers.map(center => {
      const centerLat = center.location?.coordinates?.[1] || 0;
      const centerLng = center.location?.coordinates?.[0] || 0;
      const distance = getDistance(lat, lng, centerLat, centerLng);
      return {
        ...center.toObject(),
        distanceKm: parseFloat(distance.toFixed(2))
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, parseInt(limit));

    res.json(centersWithDistance);
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};
