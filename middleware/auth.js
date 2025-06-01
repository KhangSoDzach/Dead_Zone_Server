const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token - sử dụng JWT_SECRET từ .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user info từ decoded token
    req.user = { id: decoded.user.id };
    
    console.log(`[AUTH] Token verified for user ID: ${decoded.user.id}`);
    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
