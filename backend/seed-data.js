require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');
const Center = require('./src/models/center.model');
const Pickup = require('./src/models/pickup.model');

async function seedDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_ewaste';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');

    // Create sample centers with geo coordinates (lat, lng)
    const centersData = [
      {
        name: 'Downtown Recycling Center',
        address: '123 Main St, Downtown',
        phone: '555-0001',
        email: 'downtown@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0060, 40.7128] } // NYC example
      },
      {
        name: 'North Side E-Waste Hub',
        address: '456 Oak Ave, North District',
        phone: '555-0002',
        email: 'northside@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0150, 40.7300] }
      },
      {
        name: 'East Valley Collection Point',
        address: '789 Pine Rd, East Valley',
        phone: '555-0003',
        email: 'eastvalley@ewaste.com',
        location: { type: 'Point', coordinates: [-73.9700, 40.7500] }
      },
      {
        name: 'West End E-Waste Disposal',
        address: '321 Maple Ln, West End',
        phone: '555-0004',
        email: 'westend@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0250, 40.7200] }
      },
      {
        name: 'Central Tech Recycling',
        address: '654 Elm St, Central',
        phone: '555-0005',
        email: 'central@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0080, 40.7150] }
      },
      {
        name: 'South Bay E-Waste Center',
        address: '987 Birch Blvd, South Bay',
        phone: '555-0006',
        email: 'southbay@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0130, 40.6950] }
      },
      {
        name: 'Airport District Recycling',
        address: '246 Cedar Ave, Airport District',
        phone: '555-0007',
        email: 'airport@ewaste.com',
        location: { type: 'Point', coordinates: [-73.9450, 40.7700] }
      },
      {
        name: 'Industrial Zone Collection',
        address: '135 Spruce Ct, Industrial Zone',
        phone: '555-0008',
        email: 'industrial@ewaste.com',
        location: { type: 'Point', coordinates: [-74.0400, 40.7050] }
      }
    ];

    const centers = await Center.insertMany(centersData, { ordered: false }).catch(err => {
      if (err.code === 11000) console.log('Centers already exist');
      return [];
    });

    console.log(`${centers.length || 0} centers created/skipped`);

    // Get first user (admin) to link pickups
    const adminUser = await User.findOne({ email: 'admin@admin.com' });

    // Create sample pickup requests
    const pickupsData = [
      {
        user: adminUser?._id,
        items: ['Old Monitor', 'Keyboard', 'Mouse'],
        weightGrams: 2500,
        status: 'pending',
        address: '123 Main St',
        center: centers[0]?._id
      },
      {
        user: adminUser?._id,
        items: ['Laptop', 'Charger'],
        weightGrams: 1800,
        status: 'completed',
        address: '456 Oak Ave',
        center: centers[1]?._id
      },
      {
        user: adminUser?._id,
        items: ['Printer', 'Ink Cartridges', 'Paper Tray'],
        weightGrams: 3200,
        // use a value from enum ['pending','approved','assigned','picked','completed','rejected']
        status: 'approved',
        address: '789 Pine Rd',
        center: centers[2]?._id
      }
    ];

    const pickups = await Pickup.insertMany(pickupsData, { ordered: false }).catch(err => {
      if (err.code === 11000) console.log('Pickups already exist');
      return [];
    });

    console.log(`${pickups.length || 0} pickups created/skipped`);

    console.log('\n✅ Database seeded successfully!');
    console.log('Sample data created:');
    console.log('- 3 E-waste recycling centers');
    console.log('- 3 sample pickup requests');
    console.log('\nYou can now login and view the dashboard with sample data.');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDB();
