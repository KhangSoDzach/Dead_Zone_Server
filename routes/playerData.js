const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PlayerData = require('../models/PlayerData');

// @route   GET api/player/data
// @desc    Get player data
// @access  Private
router.get('/data', auth, async (req, res) => {
  try {
    const playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/player/money
// @desc    Update player money
// @access  Private
router.put('/money', auth, async (req, res) => {
  const { money } = req.body;
  
  try {
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    playerData.money = money;
    playerData.lastSaved = Date.now();
    
    await playerData.save();
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/player/weapons
// @desc    Update player weapons
// @access  Private
router.put('/weapons', auth, async (req, res) => {
  const { weapons, currentWeapon } = req.body;
  
  try {
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    if (weapons) playerData.weapons = weapons;
    if (currentWeapon) playerData.currentWeapon = currentWeapon;
    playerData.lastSaved = Date.now();
    
    await playerData.save();
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/player/ammunition
// @desc    Update player ammunition
// @access  Private
router.put('/ammunition', auth, async (req, res) => {
  const { ammunition } = req.body;
  
  try {
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    playerData.ammunition = ammunition;
    playerData.lastSaved = Date.now();
    
    await playerData.save();
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/player/checkpoint
// @desc    Update player checkpoint
// @access  Private
router.put('/checkpoint', auth, async (req, res) => {
  const { checkpoint } = req.body;
  
  try {
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    playerData.checkpoint = checkpoint;
    playerData.lastSaved = Date.now();
    
    await playerData.save();
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/player/save
// @desc    Save all player data at once
// @access  Private
router.put('/save', auth, async (req, res) => {
  const { money, health, weapons, currentWeapon, ammunition, checkpoint, kills, level } = req.body;
  
  try {
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      return res.status(404).json({ msg: 'Player data not found' });
    }
    
    // Update fields if provided
    if (money !== undefined) playerData.money = money;
    if (health !== undefined) playerData.health = health;
    if (weapons !== undefined) playerData.weapons = weapons;
    if (currentWeapon !== undefined) playerData.currentWeapon = currentWeapon;
    if (ammunition !== undefined) playerData.ammunition = ammunition;
    if (checkpoint !== undefined) playerData.checkpoint = checkpoint;
    if (kills !== undefined) playerData.kills = kills;
    if (level !== undefined) playerData.level = level;
    
    playerData.lastSaved = Date.now();
    
    await playerData.save();
    
    res.json(playerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
