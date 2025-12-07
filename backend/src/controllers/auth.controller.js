const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

exports.register = async (req, res) => {
  try {
    const {name, email, password, role} = req.body;
    if(!name || !email || !password) return res.status(400).json({msg:'Missing fields'});
    let user = await User.findOne({email});
    if(user) return res.status(400).json({msg:'User exists'});
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user = new User({name, email, password:hash, role});
    await user.save();
    const token = jwt.sign({id:user._id, role:user.role}, JWT_SECRET, {expiresIn:'7d'});
    res.json({token, user:{id:user._id, name:user.name, email:user.email, role:user.role}});
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};

exports.login = async (req, res) => {
  try {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({msg:'Invalid credentials'});
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({msg:'Invalid credentials'});
    const token = jwt.sign({id:user._id, role:user.role}, JWT_SECRET, {expiresIn:'7d'});
    res.json({token, user:{id:user._id, name:user.name, email:user.email, role:user.role}});
  } catch(err){
    console.error(err);
    res.status(500).json({msg:'Server error'});
  }
};
