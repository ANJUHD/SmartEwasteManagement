const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

exports.ensureAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if(!token) return res.status(401).json({msg:'No token'});
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch(err){
    return res.status(401).json({msg:'Invalid token'});
  }
};

exports.requireRole = (role) => (req, res, next) => {
  // if token not provided, try to allow for public GETs
  const token = req.headers['authorization']?.split(' ')[1];
  if(!token) return res.status(401).json({msg:'No token'});
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    if(decoded.role !== role && !(role === 'admin' && decoded.role === 'admin')) return res.status(403).json({msg:'Forbidden'});
    next();
  } catch(err){
    return res.status(401).json({msg:'Invalid token'});
  }
};
