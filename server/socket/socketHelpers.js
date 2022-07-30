const io = require('./socketIO');

async function getSocketsInRoom(roomId, namespace = '/') {
  return io.of(namespace).in(roomId).fetchSockets();
}

async function getSocketsInGame(roomId, namespace) {
  return getSocketsInRoom(roomId, namespace).then((sockets) =>
    sockets.filter((socket) => socket.data.playerId),
  );
}

async function roomIsEmpty(roomId, namespace) {
  const sockets = await getSocketsInRoom(roomId, namespace);
  return sockets.length === 0;
}

async function getRoom(Room, id) {
  return Room.findById(id);
}

async function roomExists(Room, id) {
  return Room.exists({ _id: id });
}

exports.getSocketsInRoom = getSocketsInRoom;
exports.getSocketsInGame = getSocketsInGame;
exports.roomIsEmpty = roomIsEmpty;
exports.getRoom = getRoom;
exports.roomExists = roomExists;
