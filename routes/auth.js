const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const PlayerData = require('../models/PlayerData');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }
    
    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Create initial player data
    const playerData = new PlayerData({
      userId: user._id,
      weapons: [
        {
          id: 'pistol',
          name: 'Pistol',
          damage: 10,
          ammo: 30,
          level: 1,
          isUnlocked: true
        }
      ],
      currentWeapon: 'pistol',
      checkpoint: {
        sceneId: 'Tutorial',
        position: { x: 0, y: 0, z: 0 }
      }
    });

    await playerData.save();

    // Return jsonwebtoken - sử dụng JWT_SECRET từ .env
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Sử dụng JWT_SECRET từ .env thay vì fallback
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log(`[GameAPI] Token generated for user: ${user.username}`);
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Return jsonwebtoken - sử dụng JWT_SECRET từ .env
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Sử dụng JWT_SECRET từ .env thay vì fallback
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log(`[GameAPI] Token generated for user: ${user.username}`);
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get authenticated user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    console.log(`[Auth] Token verification request for user ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log(`[Auth] User not found during token verification: ${req.user.id}`);
      return res.status(404).json({ valid: false, error: 'User not found' });
    }

    console.log(`[Auth] Token verified successfully for user: ${user.username}`);
    res.json({ 
      valid: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('[Auth] Token verification error:', err.message);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// @route   POST api/auth/validate
// @desc    Alternative endpoint to validate token
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    console.log(`[Auth] Token validation request for user ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log(`[Auth] User not found during token validation: ${req.user.id}`);
      return res.status(404).json({ valid: false, error: 'User not found' });
    }

    console.log(`[Auth] Token validated successfully for user: ${user.username}`);
    res.json({ 
      valid: true, 
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('[Auth] Token validation error:', err.message);
    res.status(500).json({ valid: false, authenticated: false, error: 'Server error' });
  }
});

module.exports = router;
