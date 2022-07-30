const io = require('./socketIO');
const {
  getSocketsInGame,
  roomIsEmpty,
  getRoom,
  roomExists,
} = require('./socketHelpers');
const { generateRandomId } = require('../utils');
const deck = require('../cards');
const DssRoom = require('../models/DssRoom');

DssRoom.deleteMany().then(() => console.log('Deleted all dss rooms!'));

const NAMESPACE = '/dss';
const MAXSCORE = 7;
const MINPLAYERS = 3;

io.of(NAMESPACE).use(async (socket, next) => {
  const { data } = socket;
  const { roomId } = socket.handshake.auth;
  const isRoomExist = await roomExists(DssRoom, roomId);

  if (!isRoomExist) {
    return next(new Error('Room not found'));
  }

  data.id = generateRandomId(8);
  data.sessionId = generateRandomId(8);
  data.roomId = roomId;
  data.playerId = '';
  socket.join(roomId);

  return next();
});

io.of(NAMESPACE).on('connection', (socket) => {
  // console.log(`Socket connected: ${socket.data.id}`);

  const { roomId } = socket.data;

  socket.emit('enter lobby');

  socket.on('add player', async (username) => {
    const updatedRoom = await DssRoom.findByIdAndUpdate(
      roomId,
      {
        $push: {
          players: {
            username,
            score: 0,
            isReady: false,
            votedFor: '',
          },
        },
      },
      { new: true },
    );
    const newPlayer = updatedRoom.players.at(-1);

    socket.data.playerId = newPlayer._id.toString();
    socket.emit('set my player', {
      id: newPlayer._id,
    });
    io.of(NAMESPACE).in(roomId).emit('add player', newPlayer);
  });

  socket.on('start game', async () => {
    const room = await getRoom(DssRoom, roomId);

    if (room.inProgress) {
      return;
    }

    const newDeck = [...deck];
    const randomDeckIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomDeckIndex];

    newDeck.splice(randomDeckIndex, 1);

    const updatedRoom = await DssRoom.findByIdAndUpdate(
      roomId,
      {
        $set: {
          currentTurn: Math.floor(Math.random() * room.players.length),
          deck: newDeck,
          card: card,
          stage: 1,
          inProgress: true,
        },
      },
      { new: true },
    );

    io.of(NAMESPACE).in(roomId).emit('enter room');
    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
  });

  socket.on('player vote', async (votedForUsername) => {
    const updatedRoom = await DssRoom.findOneAndUpdate(
      { _id: roomId, players: { $elemMatch: { _id: socket.data.playerId } } },
      {
        $set: {
          'players.$.votedFor': votedForUsername,
          'players.$.isReady': true,
        },
      },
      { new: true },
    );

    socket.in(roomId).emit('clear timeouts');
    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
  });

  socket.on('next stage', async (stage) => {
    const updatedRoom = await DssRoom.findByIdAndUpdate(
      roomId,
      {
        $set:
          stage === 1
            ? {
                'players.$[].votedFor': '',
                'players.$[].isReady': false,
                stage,
              }
            : { stage },
      },
      { new: true },
    );

    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
  });

  socket.on('judge vote', async (votedFor) => {
    const room = await getRoom(DssRoom, roomId);
    const judge = room.players[room.currentTurn];
    const player = room.players.find(
      (player) => player._id.toString() === votedFor.id,
    );
    const nextTurn =
      room.currentTurn < room.players.length - 1 ? room.currentTurn + 1 : 0;
    const updatedDeck = [...room.deck];
    const randomDeckIndex = Math.floor(Math.random() * room.deck.length);
    const card = room.deck[randomDeckIndex];

    updatedDeck.splice(randomDeckIndex, 1);

    const update =
      player.score + 1 < MAXSCORE
        ? {
            $inc: { 'players.$.score': 1 },
            $set: {
              currentTurn: nextTurn,
              deck: updatedDeck,
              card: card,
              stage: 1,
            },
          }
        : {
            $set: {
              players: [],
              currentTurn: -1,
              deck: [],
              card: votedFor.username + ' lost!',
              inProgress: false,
            },
          };

    if (player.score + 1 < MAXSCORE) {
      await DssRoom.findByIdAndUpdate(roomId, {
        $set: {
          'players.$[].votedFor': '',
          'players.$[].isReady': false,
        },
      });
    }
    const updatedRoom = await DssRoom.findOneAndUpdate(
      { _id: roomId, players: { $elemMatch: { _id: votedFor.id } } },
      update,
      { new: true },
    );

    if (player.score + 1 < MAXSCORE) {
      io.of(NAMESPACE)
        .in(roomId)
        .emit(
          'next round',
          updatedRoom,
          `${judge.username} chose ${votedFor.username}`,
        );
    } else {
      const sockets = await getSocketsInGame(roomId, NAMESPACE);

      sockets.forEach((socket) => {
        socket.data.playerId = '';
      });

      socket.in(roomId).emit('clear timeouts');
      io.of(NAMESPACE)
        .in(roomId)
        .emit('game over', updatedRoom, votedFor.username + ' loses!');
    }
  });

  socket.on('disconnect', async () => {
    // console.log(`Socket disconnected: ${socket.data.id}`);

    if (await roomIsEmpty(roomId, 'dss')) {
      await DssRoom.findByIdAndDelete(roomId);
      return;
    }

    if (!socket.data.playerId) {
      return;
    }

    const room = await getRoom(DssRoom, roomId);
    let update = null;

    if (room.players.length > MINPLAYERS) {
      const disconnectedPlayerIndex = room.players.findIndex(
        (player) => player._id.toString() === socket.data.playerId,
      );
      const isLastIndex =
        room.currentTurn === disconnectedPlayerIndex &&
        room.currentTurn + 1 >= room.players.length;
      let updatedTurn = room.currentTurn;

      if (isLastIndex) {
        updatedTurn = 0;
      }

      if (room.currentTurn > disconnectedPlayerIndex) {
        updatedTurn = room.currentTurn - 1;
      }

      update = {
        $set: { currentTurn: updatedTurn },
        $pull: { players: { _id: socket.data.playerId } },
      };
    } else {
      const sockets = await getSocketsInGame(roomId, NAMESPACE);

      sockets.forEach((socket) => {
        socket.data.playerId = '';
      });

      update = {
        $set: {
          players: [],
          currentTurn: -1,
          deck: [],
          card: 'Player disconnected. Not enough player!',
          inProgress: false,
        },
      };

      socket.in(roomId).emit('clear timeouts');
    }

    const updatedRoom = await DssRoom.findByIdAndUpdate(roomId, update, {
      new: true,
    });

    socket.in(roomId).emit('set room', updatedRoom);
  });
});
