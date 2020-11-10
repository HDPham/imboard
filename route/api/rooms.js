const express = require('express');

// Models
const Room = require('../../models/Room');
// const Player = require('../../models/Player');

const router = express.Router();

router.get('/', (req, res) => {
	Room.find().then(rooms => res.json(rooms));
});

router.get('/:roomCode', (req, res) => {
	Room.findOne({ code: req.params.roomCode }).then(room => res.json(room));
});

// router.get('/:roomId', (req, res) => {
// 	Room.findById(req.params.roomId).then(room => res.json(room));
// });

router.post('/', (req, res) => {
	const newRoom = new Room({
		code: req.body.code,
		players: [],
		judgeIndex: -1,
		inProgress: false
	});
	newRoom.save().then(room => res.json(room));
});

router.put('/', (req, res) => {
	Room.findByIdAndUpdate(
		req.body._id,
		{
			players: req.body.players,
			judgeIndex: req.body.judgeIndex,
			inProgress: req.body.inProgress
		},
		{ new: true }
	).then(room => res.json(room));
});

router.delete('/:id', (req, res) => {
	Room.findByIdAndDelete(req.params.id).then(room => res.json(room));
});

module.exports = router;
