const io = require('./socketIO');
const {
  getSocketsInRoom,
  getSocketsInGame,
  roomIsEmpty,
  getRoom,
  roomExists,
} = require('./socketHelpers');
const { generateRandomId } = require('../utils');
const CoupRoom = require('../models/CoupRoom');

CoupRoom.deleteMany().then(() => console.log('Deleted all coup rooms!'));

const NAMESPACE = '/coup';

io.of(NAMESPACE).use(async (socket, next) => {
  const { data } = socket;
  const { roomId } = socket.handshake.auth;
  const isRoomExist = await roomExists(CoupRoom, roomId);

  if (!isRoomExist) {
    return next(new Error('Room not found'));
  }

  data.id = generateRandomId(8);
  data.sessionId = generateRandomId(8);
  data.roomId = roomId;
  data.playerId = '';
  data.cards = [];
  socket.join(roomId);

  return next();
});

io.of(NAMESPACE).on('connection', async (socket) => {
  // console.log(`Socket connected: ${socket.data.id}`);

  const { roomId } = socket.data;

  socket.emit('enter lobby');

  socket.on('add player', async (username) => {
    const updatedRoom = await CoupRoom.findByIdAndUpdate(
      roomId,
      {
        $push: {
          players: {
            username,
            coinCount: 2,
            cardCount: 2,
            discardedCards: [],
            isEliminated: false,
          },
        },
      },
      { new: true },
    );
    const newPlayer = updatedRoom.players.at(-1);

    socket.data.playerId = newPlayer._id.toString();
    socket.emit('set my player', {
      id: newPlayer._id,
      username: newPlayer.username,
      cards: [],
      isEliminated: false,
    });
    io.of(NAMESPACE).in(roomId).emit('add player', newPlayer);
  });

  socket.on('start game', async () => {
    const room = await getRoom(CoupRoom, roomId);

    if (room.inProgress) {
      return;
    }

    const deck = [
      'Duke',
      'Duke',
      'Duke',
      'Assassin',
      'Assassin',
      'Assassin',
      'Contessa',
      'Contessa',
      'Contessa',
      'Captain',
      'Captain',
      'Captain',
      'Ambassador',
      'Ambassador',
      'Ambassador',
    ];
    const sockets = await getSocketsInGame(roomId, NAMESPACE);

    for (let i = 0; i < 2; i += 1) {
      sockets.forEach((socket) => {
        const randomDeckIndex = Math.floor(Math.random() * deck.length);

        socket.data.cards.push(deck[randomDeckIndex]);
        deck.splice(randomDeckIndex, 1);
      });
    }

    const updatedRoom = await CoupRoom.findByIdAndUpdate(
      roomId,
      {
        $set: {
          currentTurn: Math.floor(Math.random() * room.players.length),
          inProgress: true,
        },
        $push: {
          deck: {
            $each: deck,
          },
        },
      },
      { new: true },
    );

    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
    sockets.forEach((socket) => socket.emit('add my cards', socket.data.cards));
    io.of(NAMESPACE).in(roomId).emit('enter room');
  });

  socket.on('update room', async (room) => {
    const updatedRoom = await CoupRoom.findByIdAndUpdate(roomId, room, {
      new: true,
    });

    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
  });

  socket.on('draw 2 cards', async () => {
    const room = await getRoom(CoupRoom, roomId);
    const updatedDeck = [...room.deck];

    for (let i = 0; i < 2; i += 1) {
      const randomDeckIndex = Math.floor(Math.random() * updatedDeck.length);

      socket.data.cards.push(updatedDeck[randomDeckIndex]);
      updatedDeck.splice(randomDeckIndex, 1);
    }

    await CoupRoom.findByIdAndUpdate(
      roomId,
      { deck: updatedDeck },
      { new: true },
    );

    socket.emit('set my cards', socket.data.cards);
  });

  socket.on('chat message', (playerName, message) => {
    io.of(NAMESPACE).in(roomId).emit('chat message', playerName, message);
  });

  socket.on('action', (action, targetPlayer) => {
    socket.in(roomId).emit('action (others)', action, targetPlayer);
    socket.emit('action', action, targetPlayer);
  });

  socket.on('counteraction', (counteraction, blocker) => {
    io.of(NAMESPACE).in(roomId).emit('counteraction', counteraction, blocker);
  });

  socket.on('challenge', async (prosecutor, defendant, action) => {
    const room = await getRoom(CoupRoom, roomId);
    const defendantPlayerSocket = await getSocketsInRoom(
      roomId,
      NAMESPACE,
    ).then((sockets) =>
      sockets.find((socket) => socket.data.playerId === defendant._id),
    );
    const isTruthful = defendantPlayerSocket.data.cards.includes(action);

    // Defendant is telling the truth -> Replaces known card
    if (isTruthful) {
      const { cards } = defendantPlayerSocket.data;
      const updatedDeck = [...room.deck, action];
      const randomDeckIndex = Math.floor(Math.random() * updatedDeck.length);

      cards.splice(cards.indexOf(action), 1);
      cards.push(updatedDeck[randomDeckIndex]);
      updatedDeck.splice(randomDeckIndex, 1);

      CoupRoom.findByIdAndUpdate(roomId, { deck: updatedDeck }, { new: true });

      defendantPlayerSocket.emit('set my cards', cards);
    }

    io.of(NAMESPACE)
      .in(roomId)
      .emit('challenge', prosecutor, defendant, isTruthful);
  });

  socket.on('transition to exchange', () => {
    io.of(NAMESPACE).in(roomId).emit('transition to exchange');
  });

  socket.on('transition to removal', (targetUsername) => {
    io.of(NAMESPACE).in(roomId).emit('transition to removal', targetUsername);
  });

  socket.on(
    'remove player cards',
    async (playerId, action, isRoundOver, keepCardIndexes = []) => {
      const room = await getRoom(CoupRoom, roomId);
      const playerEntity = room.players.find(
        (player) => player._id.toString() === playerId,
      );
      const playerSocket = await getSocketsInRoom(roomId, NAMESPACE).then(
        (sockets) =>
          sockets.find((socket) => socket.data.playerId === playerId),
      );
      const keepCards = playerSocket.data.cards.filter((card, index) =>
        keepCardIndexes.includes(index),
      );
      const discardCards = playerSocket.data.cards.filter(
        (card, index) => !keepCardIndexes.includes(index),
      );
      const isEliminated = keepCardIndexes.length === 0;
      const updatedRoom = await CoupRoom.findOneAndUpdate(
        { _id: roomId, players: { $elemMatch: { _id: playerId } } },
        {
          $set: {
            'players.$.cardCount': keepCardIndexes.length,
            'players.$.discardedCards': [
              ...playerEntity.discardedCards,
              ...discardCards,
            ],
            'players.$.isEliminated': isEliminated,
          },
        },
        { new: true },
      );

      playerSocket.data.cards = keepCards;
      playerSocket.emit('keep my cards', keepCardIndexes);
      playerSocket.emit('set my elimination status', isEliminated);
      io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
      io.of(NAMESPACE)
        .in(roomId)
        .emit('display results', action, isRoundOver, discardCards);
    },
  );

  socket.on('display results', (action) => {
    io.of(NAMESPACE).in(roomId).emit('display results', action, true);
  });

  socket.on('next round', async (nextTurn) => {
    const updatedRoom = await CoupRoom.findByIdAndUpdate(
      roomId,
      { currentTurn: nextTurn },
      { new: true },
    );

    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
    io.of(NAMESPACE).in(roomId).emit('next round');
  });

  socket.on('end game', async () => {
    const sockets = await getSocketsInGame(roomId, NAMESPACE);
    const updatedRoom = await CoupRoom.findByIdAndUpdate(
      roomId,
      { $set: { players: [], currentTurn: -1, inProgress: false, deck: [] } },
      { new: true },
    );

    sockets.forEach((socket) => {
      socket.data.playerId = '';
      socket.data.cards = [];
    });
    io.of(NAMESPACE).in(roomId).emit('set room', updatedRoom);
  });

  socket.on('return cards', (keepCardIndexes) => {
    const returnCards = socket.data.cards.filter(
      (card, index) => !keepCardIndexes.includes(index),
    );

    CoupRoom.findByIdAndUpdate(
      roomId,
      {
        $push: {
          deck: {
            $each: returnCards,
          },
        },
      },
      { new: true },
    );
    socket.data.cards = socket.data.cards.filter((card, index) =>
      keepCardIndexes.includes(index),
    );

    io.of(NAMESPACE).in(roomId).emit('display results', 'Ambassador', true);
  });

  socket.on('disconnect', async () => {
    // console.log(`Socket disconnected: ${socket.data.id}`);

    if (await roomIsEmpty(roomId, 'coup')) {
      await CoupRoom.findByIdAndDelete(roomId);
      return;
    }

    if (!socket.data.playerId) {
      return;
    }

    const room = await getRoom(CoupRoom, roomId);
    let updatedTurn = room.currentTurn;
    let isRemovingCurrPlayer = false;

    if (room.inProgress) {
      const removedPlayerIndex = room.players.findIndex(
        (player) => player._id.toString() === socket.data.playerId,
      );

      isRemovingCurrPlayer = room.currentTurn === removedPlayerIndex;
      updatedTurn =
        room.currentTurn >= removedPlayerIndex
          ? room.currentTurn - 1
          : room.currentTurn;
    }

    const updatedRoom = await CoupRoom.findByIdAndUpdate(
      roomId,
      {
        $set: { currentTurn: updatedTurn },
        $pull: { players: { _id: socket.data.playerId } },
      },
      { new: true },
    );

    socket.in(roomId).emit('set room', updatedRoom);

    if (room.inProgress) {
      socket
        .in(roomId)
        .emit('player left', socket.data.playerId, isRemovingCurrPlayer);
    }
  });
});
