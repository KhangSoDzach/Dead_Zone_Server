const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PlayerData = require('../models/PlayerData');
const User = require('../models/User');

// @route   GET api/player/data
// @desc    Get player data
// @access  Private
router.get('/data', auth, async (req, res) => {
  try {
    console.log(`[PlayerData] Fetching data for user ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log(`[PlayerData] User not found with ID: ${req.user.id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[PlayerData] Found user: ${user.username}`);
    
    // Fetch PlayerData for the user - KHÔNG tự động tạo mới nếu không có
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      console.log(`[PlayerData] No existing PlayerData found for user: ${user.username}`);
      console.log(`[PlayerData] This might be a new account or data was lost`);
      
      // Chỉ tạo mới nếu đây thực sự là tài khoản mới (kiểm tra thời gian tạo)
      const accountAge = Date.now() - new Date(user.created).getTime();
      const isNewAccount = accountAge < (5 * 60 * 1000); // 5 phút
      
      if (isNewAccount) {
        console.log(`[PlayerData] Creating initial PlayerData for new user: ${user.username}`);
        playerData = new PlayerData({
          userId: req.user.id,
          money: 0,
          health: 100,
          ammunition: { pistol: 30, rifle: 0 },
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
            sceneId: 'City',
            position: { x: 0, y: 0, z: 0 }
          },
          kills: 0,
          level: 1
        });
        await playerData.save();
      } else {
        console.log(`[PlayerData] WARNING: Existing account has no PlayerData - possible data loss!`);
        return res.status(404).json({ 
          error: 'Player data not found',
          message: 'Your game data may have been lost. Please contact support.',
          isDataLoss: true
        });
      }
    }
    
    // Debug log trước khi trả về
    console.log(`[PlayerData] Found player data:`, {
      money: playerData.money,
      health: playerData.health,
      ammunition: playerData.ammunition,
      weapons: playerData.weapons,
      kills: playerData.kills,
      level: playerData.level,
      lastSaved: playerData.lastSaved
    });
    
    // Trả về dữ liệu từ PlayerData thay vì User
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      level: playerData.level,
      experience: user.experience || 0,
      money: playerData.money,
      health: playerData.health,
      lastLoginDate: user.lastLoginDate,
      checkpoint: playerData.checkpoint || {
        sceneId: 'City',
        position: { x: 0, y: 0, z: 0 },
        timestamp: new Date().toISOString(),
        additionalData: ''
      },
      weapons: playerData.weapons || [],
      ammunition: playerData.ammunition || { pistol: 30, rifle: 0 },
      currentWeapon: playerData.currentWeapon,
      kills: playerData.kills
    };
    
    console.log('[PlayerData] Sending user data:', userData);
    res.json(userData);
  } catch (error) {
    console.error('[PlayerData] Get player data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/player/debug
// @desc    Debug player data in database
// @access  Private
router.get('/debug', auth, async (req, res) => {
  try {
    console.log(`[PlayerData] Debug - Fetching raw data for user ID: ${req.user.id}`);
    
    const playerData = await PlayerData.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    
    console.log(`[PlayerData] Debug - Raw PlayerData from DB:`, playerData);
    console.log(`[PlayerData] Debug - Raw User from DB:`, user);
    
    res.json({
      success: true,
      userId: req.user.id,
      playerData: playerData,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PlayerData] Debug error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE api/player/reset
// @desc    Reset player data to defaults (for testing)
// @access  Private
router.delete('/reset', auth, async (req, res) => {
  try {
    console.log(`[PlayerData] Resetting data for user ID: ${req.user.id}`);
    
    await PlayerData.findOneAndDelete({ userId: req.user.id });
    
    const newPlayerData = new PlayerData({
      userId: req.user.id,
      money: 0,
      health: 100,
      ammunition: { pistol: 30, rifle: 0 },
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
        sceneId: 'City',
        position: { x: 0, y: 0, z: 0 }
      },
      kills: 0,
      level: 1
    });
    
    await newPlayerData.save();
    
    console.log(`[PlayerData] Player data reset successfully for user ID: ${req.user.id}`);
    res.json({ 
      success: true, 
      message: 'Player data reset successfully',
      playerData: newPlayerData 
    });
  } catch (error) {
    console.error('[PlayerData] Reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/player/data
// @desc    Update player data
// @access  Private
router.post('/data', auth, async (req, res) => {
  try {
    console.log(`[PlayerData] POST - Updating data for user ID: ${req.user.id}`);
    console.log(`[PlayerData] POST - Raw request body:`, JSON.stringify(req.body, null, 2));
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { money, health, weapons, currentWeapon, ammunition, checkpoint, kills, level } = req.body;
    
    // Sử dụng findOneAndUpdate để force update
    const updatedPlayerData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          ...(money !== null && money !== undefined && { money: Number(money) }),
          ...(health !== null && health !== undefined && { health: Number(health) }),
          ...(weapons !== null && weapons !== undefined && { weapons: weapons }),
          ...(currentWeapon !== null && currentWeapon !== undefined && { currentWeapon: currentWeapon }),
          ...(ammunition !== null && ammunition !== undefined && { 
            ammunition: {
              pistol: Number(ammunition.pistol || 0),
              rifle: Number(ammunition.rifle || 0)
            }
          }),
          ...(checkpoint !== null && checkpoint !== undefined && { checkpoint: checkpoint }),
          ...(kills !== null && kills !== undefined && { kills: Number(kills) }),
          ...(level !== null && level !== undefined && { level: Number(level) }),
          lastSaved: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] POST - Successfully updated data for user ID: ${req.user.id}`);
    console.log(`[PlayerData] POST - Final saved values:`, {
      money: updatedPlayerData.money,
      health: updatedPlayerData.health,
      ammunition: updatedPlayerData.ammunition,
      weapons: updatedPlayerData.weapons?.length || 0,
      kills: updatedPlayerData.kills,
      level: updatedPlayerData.level,
      lastSaved: updatedPlayerData.lastSaved
    });
    
    res.json({ 
      success: true, 
      message: 'Player data saved successfully',
      playerData: updatedPlayerData 
    });
  } catch (error) {
    console.error('[PlayerData] POST - Update player data error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   PUT api/player/money
// @desc    Update player money
// @access  Private
router.put('/money', auth, async (req, res) => {
  const { money } = req.body;
  
  try {
    console.log(`[PlayerData] Updating money for user ID: ${req.user.id} to ${money}`);
    
    const updatedPlayerData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          money: Number(money),
          lastSaved: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] Money updated successfully to: ${updatedPlayerData.money}`);
    res.json(updatedPlayerData);
  } catch (err) {
    console.error('[PlayerData] Money update error:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// @route   PUT api/player/weapons
// @desc    Update player weapons
// @access  Private
router.put('/weapons', auth, async (req, res) => {
  const { weapons, currentWeapon } = req.body;
  
  try {
    console.log(`[PlayerData] Updating weapons for user ID: ${req.user.id}`);
    console.log(`[PlayerData] Weapons:`, weapons);
    console.log(`[PlayerData] Current weapon:`, currentWeapon);
    
    const updateData = {
      lastSaved: new Date()
    };
    
    if (weapons !== undefined && weapons !== null) {
      updateData.weapons = weapons;
    }
    if (currentWeapon !== undefined && currentWeapon !== null) {
      updateData.currentWeapon = currentWeapon;
    }
    
    const updatedPlayerData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] Weapons updated successfully`);
    res.json(updatedPlayerData);
  } catch (err) {
    console.error('[PlayerData] Weapons update error:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// @route   PUT api/player/ammunition
// @desc    Update player ammunition
// @access  Private
router.put('/ammunition', auth, async (req, res) => {
  const { ammunition } = req.body;
  
  try {
    console.log(`[PlayerData] Updating ammunition for user ID: ${req.user.id}`);
    console.log(`[PlayerData] Ammunition:`, ammunition);
    
    const updatedPlayerData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          ammunition: {
            pistol: Number(ammunition.pistol || 0),
            rifle: Number(ammunition.rifle || 0)
          },
          lastSaved: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] Ammunition updated successfully:`, updatedPlayerData.ammunition);
    res.json(updatedPlayerData);
  } catch (err) {
    console.error('[PlayerData] Ammunition update error:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// @route   PUT api/player/checkpoint
// @desc    Update player checkpoint
// @access  Private
router.put('/checkpoint', auth, async (req, res) => {
  const { checkpoint } = req.body;
  
  try {
    console.log(`[PlayerData] Updating checkpoint for user ID: ${req.user.id}`);
    console.log(`[PlayerData] Checkpoint:`, checkpoint);
    
    const updatedPlayerData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          checkpoint: checkpoint,
          lastSaved: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] Checkpoint updated successfully`);
    res.json(updatedPlayerData);
  } catch (err) {
    console.error('[PlayerData] Checkpoint update error:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// @route   PUT api/player/save
// @desc    Save all player data at once
// @access  Private
router.put('/save', auth, async (req, res) => {
  try {
    console.log(`[PlayerData] Saving data for user ID: ${req.user.id}`);
    console.log(`[PlayerData] Raw request body:`, JSON.stringify(req.body, null, 2));
    
    const { money, health, weapons, currentWeapon, ammunition, checkpoint, kills, level } = req.body;
    
    // Tìm hoặc tạo PlayerData
    let playerData = await PlayerData.findOne({ userId: req.user.id });
    
    if (!playerData) {
      console.log(`[PlayerData] Creating new PlayerData for user ID: ${req.user.id}`);
      playerData = new PlayerData({
        userId: req.user.id,
        money: 0,
        health: 100,
        ammunition: { pistol: 30, rifle: 0 },
        weapons: [],
        currentWeapon: null,
        checkpoint: {
          sceneId: 'City',
          position: { x: 0, y: 0, z: 0 }
        },
        kills: 0,
        level: 1
      });
    }
    
    console.log(`[PlayerData] Current values before update:`, {
      money: playerData.money,
      health: playerData.health,
      ammunition: playerData.ammunition,
      weapons: playerData.weapons?.length || 0,
      kills: playerData.kills,
      level: playerData.level
    });
    
    // Force update tất cả các field - không check undefined
    if (money !== null && money !== undefined) {
      console.log(`[PlayerData] Force updating money from ${playerData.money} to ${money}`);
      playerData.money = Number(money);
    }
    
    if (health !== null && health !== undefined) {
      console.log(`[PlayerData] Force updating health from ${playerData.health} to ${health}`);
      playerData.health = Number(health);
    }
    
    if (weapons !== null && weapons !== undefined) {
      console.log(`[PlayerData] Force updating weapons (${weapons?.length || 0} items):`, weapons);
      playerData.weapons = weapons;
    }
    
    if (currentWeapon !== null && currentWeapon !== undefined) {
      console.log(`[PlayerData] Force updating currentWeapon from "${playerData.currentWeapon}" to "${currentWeapon}"`);
      playerData.currentWeapon = currentWeapon;
    }
    
    if (ammunition !== null && ammunition !== undefined) {
      console.log(`[PlayerData] Force updating ammunition:`, ammunition);
      playerData.ammunition = {
        pistol: Number(ammunition.pistol || 0),
        rifle: Number(ammunition.rifle || 0)
      };
    }
    
    if (checkpoint !== null && checkpoint !== undefined) {
      console.log(`[PlayerData] Force updating checkpoint:`, checkpoint);
      playerData.checkpoint = checkpoint;
    }
    
    if (kills !== null && kills !== undefined) {
      console.log(`[PlayerData] Force updating kills from ${playerData.kills} to ${kills}`);
      playerData.kills = Number(kills);
    }
    
    if (level !== null && level !== undefined) {
      console.log(`[PlayerData] Force updating level from ${playerData.level} to ${level}`);
      playerData.level = Number(level);
    }
    
    // Luôn cập nhật lastSaved
    playerData.lastSaved = new Date();
    
    console.log(`[PlayerData] Final values before save:`, {
      money: playerData.money,
      health: playerData.health,
      ammunition: playerData.ammunition,
      weapons: playerData.weapons?.length || 0,
      kills: playerData.kills,
      level: playerData.level,
      lastSaved: playerData.lastSaved
    });
    
    // Sử dụng findOneAndUpdate để đảm bảo ghi đè
    const savedData = await PlayerData.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          money: playerData.money,
          health: playerData.health,
          ammunition: playerData.ammunition,
          weapons: playerData.weapons,
          currentWeapon: playerData.currentWeapon,
          checkpoint: playerData.checkpoint,
          kills: playerData.kills,
          level: playerData.level,
          lastSaved: playerData.lastSaved
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log(`[PlayerData] Successfully saved data for user ID: ${req.user.id}`);
    console.log(`[PlayerData] Final saved values:`, {
      money: savedData.money,
      health: savedData.health,
      ammunition: savedData.ammunition,
      weapons: savedData.weapons?.length || 0,
      kills: savedData.kills,
      level: savedData.level,
      lastSaved: savedData.lastSaved
    });
    
    res.json({ 
      success: true, 
      message: 'Player data saved successfully',
      playerData: savedData 
    });
  } catch (err) {
    console.error('[PlayerData] Save error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error', 
      details: err.message 
    });
  }
});

module.exports = router;
