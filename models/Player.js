const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true
		},
		score: {
			type: Number,
			required: true
		},
		isReady: {
			type: Boolean,
			required: true
		},
		chosenPlayerName: {
			type: String,
			required: true
		}
	},
	{ versionKey: false }
);

module.exports = mongoose.model('players', playerSchema);
