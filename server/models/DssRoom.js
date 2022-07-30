const mongoose = require('mongoose');
const config = require('../config');

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    isReady: {
      type: Boolean,
      required: true,
    },
    votedFor: {
      type: String,
      required: true,
    },
    // votedBy: {
    //   type: [String],
    //   required: true,
    // },
  },
  { versionKey: false },
);

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    players: {
      type: [playerSchema],
      required: true,
    },
    currentTurn: {
      type: Number,
      required: true,
    },
    deck: {
      type: [String],
      required: true,
    },
    card: {
      type: String,
    },
    stage: {
      type: Number,
      required: true,
    },
    inProgress: {
      type: Boolean,
      required: true,
    },
  },
  { versionKey: false },
);

module.exports = mongoose.model(
  config.NODE_ENV === 'production' ? 'dss_rooms' : 'dss_rooms_dev',
  roomSchema,
);
