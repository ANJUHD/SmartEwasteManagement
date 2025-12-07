require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function seedUsers() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_ewaste';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for user seeding');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@admin.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created: admin@admin.com / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create regular user for mobile app
    const userExists = await User.findOne({ email: 'user@example.com' });
    if (!userExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);
      const user = new User({
        name: 'Mobile User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user'
      });
      await user.save();
      console.log('✅ Mobile user created: user@example.com / user123');
    } else {
      console.log('✅ Mobile user already exists');
    }

    console.log('\n✅ All users ready!');
    process.exit(0);
  } catch (err) {
    console.error('User seeding error:', err);
    process.exit(1);
  }
}

seedUsers();
