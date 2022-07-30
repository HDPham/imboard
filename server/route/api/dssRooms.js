const express = require('express');
const Room = require('../../models/DssRoom');
const { generateRandomString } = require('../../utils');

const router = express.Router();

router.get('/', (req, res) => {
  Room.find().then((rooms) => res.json(rooms));
});

router.get('/:roomCode', (req, res) => {
  Room.findOne({ code: req.params.roomCode }).then((room) => res.json(room));
});

router.post('/', async (req, res) => {
  const rooms = await Room.find();
  const roomCodes = new Set(rooms.map((room) => room.code));
  let roomCode = generateRandomString(6);

  while (roomCodes.has(roomCode)) {
    roomCode = generateRandomString(6);
  }

  const newRoom = await Room.create({
    code: roomCode,
    players: [],
    currentTurn: -1,
    deck: [],
    card: '',
    stage: -1,
    inProgress: false,
    messages: [],
  });

  res.json(newRoom);
});

// router.put('/:roomCode', (req, res) => {
//   Room.findOneAndUpdate({ code: req.params.roomCode }, req.body, {
//     new: true,
//   }).then((room) => res.json(room));
// });

// router.delete('/:roomCode', (req, res) => {
//   Room.findOneAndDelete({ code: req.params.roomCode }).then((room) =>
//     res.json(room),
//   );
// });

module.exports = router;
