const Room = require('./models/Room');

module.exports = function (io, socket, socketData, storage) {
	socket.on('set player name [dss]', playerName => {
		socketData.playerName = playerName;
	});

	socket.on('start game [dss]', () => {
		io.to(socketData.roomId).emit('start game');
	});

	socket.on('update room (all clients) [dss]', room => {
		io.to(socketData.roomId).emit('update room', room);
	});

	socket.on('initialize room state [dss]', () => {
		socket.emit('update room state', storage.get(socketData.roomId).roomState);
	});

	socket.on('set room state [dss]', roomState => {
		storage.get(socketData.roomId).roomState = roomState;
	});

	socket.on('update room state (all clients) [dss]', roomState => {
		storage.get(socketData.roomId).roomState = {
			...storage.get(socketData.roomId).roomState,
			...roomState
		};
		io.to(socketData.roomId).emit(
			'update room state',
			storage.get(socketData.roomId).roomState
		);
	});

	socket.on('go to stage 2 [dss]', () => {
		storage.get(socketData.roomId).roomState.stage = 2;
		io.to(socketData.roomId).emit('go to stage 2');
	});

	socket.on('round transition [dss]', chosenPlayerName => {
		io.to(socketData.roomId).emit('round transition', chosenPlayerName);
	});

	socket.on('game over transition [dss]', loserName => {
		io.to(socketData.roomId).emit('game over transition', loserName);
	});
};
