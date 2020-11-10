const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true
		},
		players: {
			type: Array,
			required: true
		},
		judgeIndex: {
			type: Number,
			required: true
		},
		inProgress: {
			type: Boolean,
			required: true
		}
	},
	{ versionKey: false }
);

module.exports = mongoose.model('rooms', roomSchema);
