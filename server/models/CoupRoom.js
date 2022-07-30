const mongoose = require('mongoose');
const config = require('../config');

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    coinCount: {
      type: Number,
      required: true,
    },
    cardCount: {
      type: Number,
      required: true,
    },
    discardedCards: {
      type: [String],
      required: true,
    },
    isEliminated: {
      type: Boolean,
      required: true,
    },
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
    inProgress: {
      type: Boolean,
      required: true,
    },
    deck: {
      type: [String],
      required: true,
    },
    messages: {
      type: [String],
      required: true,
    },
  },
  { versionKey: false },
);

roomSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.deck;
    return ret;
  },
});

module.exports = mongoose.model(
  config.NODE_ENV === 'production' ? 'coup_rooms' : 'coup_rooms_dev',
  roomSchema,
);
