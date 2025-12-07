-- MongoDB is used; sample collections will be created automatically.
-- For convenience, you can seed an admin user via the following script (run in Node REPL):

/*
const mongoose = require('mongoose');
const User = require('./backend/src/models/user.model');
await mongoose.connect('mongodb://localhost:27017/smart_ewaste');
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('admin123',10);
await User.create({name:'Admin', email:'admin@admin.com', password:hash, role:'admin'});
const userHash = await bcrypt.hash('user123',10);
await User.create({name:'Demo User', email:'user@example.com', password:userHash, role:'user'});
*/
