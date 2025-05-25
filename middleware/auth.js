const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'deadzonesecretkey');
      
      // Add user from payload
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Authorization middleware error:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = auth;
