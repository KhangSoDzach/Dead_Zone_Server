const mongoose = require('mongoose');

const WeaponSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  damage: {
    type: Number,
    default: 0
  },
  ammo: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  isUnlocked: {
    type: Boolean,
    default: false
  }
});

const CheckpointSchema = new mongoose.Schema({
  sceneId: {
    type: String,
    required: true
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const PlayerDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  money: {
    type: Number,
    default: 0
  },
  health: {
    type: Number,
    default: 100
  },
  ammunition: {
    pistol: { type: Number, default: 30 },
    rifle: { type: Number, default: 0 }
  },
  weapons: [WeaponSchema],
  currentWeapon: {
    type: String,
    default: null
  },
  checkpoint: CheckpointSchema,
  kills: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  lastSaved: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlayerData', PlayerDataSchema);
