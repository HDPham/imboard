const io = require('socket.io')(require('./server'), {
	cors: { origin: 'http://localhost:3000' }
});
const onCoup = require('./socketio-coup');
const onDss = require('./socketio-dss');

const Room = require('./models/Room');
Room.deleteMany().then(() => console.log('Deleted all rooms!'));

const coupStorage = new Map();
const dssStorage = new Map();

io.on('connect', socket => {
	console.log(`Socket connected: ${socket.client.id}`);

	const socketData = { roomId: '', playerName: '', game: '' };

	onCoup(io, socket, socketData, coupStorage);
	onDss(io, socket, socketData, dssStorage);

	function coupRemovePlayer() {
		if (socketData.playerName !== '') {
			const { room, playerCardMap, playerSocketMap } = coupStorage.get(
				socketData.roomId
			);
			let isTurnPlayerRemoved = false;

			if (room.inProgress) {
				const removedPlayerIndex = room.players.findIndex(
					player => player.name === socketData.playerName
				);

				isTurnPlayerRemoved = room.turnIndex === removedPlayerIndex;
				room.turnIndex =
					room.turnIndex >= removedPlayerIndex
						? room.turnIndex - 1
						: room.turnIndex;
			}

			room.players = room.players.filter(
				player => player.name !== socketData.playerName
			);
			playerCardMap.delete(socketData.playerName);
			playerSocketMap.delete(socketData.playerName);

			io.to(socketData.roomId).emit('update room', room);

			if (room.inProgress) {
				socket
					.to(socketData.roomId)
					.emit('player left', socketData.playerName, isTurnPlayerRemoved);
			}

			socket.emit('update player', null);
			socketData.playerName = '';
		}
	}

	function coupLeaveRoom() {
		if (socketData.roomId !== '') {
			socket.leave(socketData.roomId);

			if (
				typeof io.sockets.adapter.rooms.get(socketData.roomId) === 'undefined'
			) {
				coupStorage.delete(socketData.roomId);
			}

			socket.emit('update room', null);
			socketData.roomId = '';
		}
	}

	async function dssRemovePlayer() {
		if (socketData.playerName !== '') {
			const room = await Room.findById(socketData.roomId);

			if (room.inProgress) {
				const removedPlayerIndex = room.players.findIndex(
					player => player.name === socketData.playerName
				);

				if (removedPlayerIndex < room.judgeIndex) {
					room.judgeIndex--;
				} else if (room.judgeIndex >= room.players.length - 1) {
					room.judgeIndex = 0;
				}
			}

			const updatedRoom = await Room.findByIdAndUpdate(
				socketData.roomId,
				{
					judgeIndex: room.judgeIndex,
					$pull: { players: { name: socketData.playerName } }
				},
				{ new: true }
			);

			socket.to(socketData.roomId).emit('update room', updatedRoom);
			socketData.playerName = '';
		}
	}

	function dssLeaveRoom() {
		if (socketData.roomId !== '') {
			socket.leave(socketData.roomId);

			if (
				typeof io.sockets.adapter.rooms.get(socketData.roomId) === 'undefined'
			) {
				Room.findByIdAndDelete(socketData.roomId, err => {
					if (err) {
						console.error(err);
					}
				});
				dssStorage.delete(socketData.roomId);
			}

			socketData.roomId = '';
		}
	}

	socket.on('leave room [coup]', () => {
		coupLeaveRoom();
	});

	socket.on('remove player [coup]', () => {
		coupRemovePlayer();
	});

	socket.on('enter room [dss]', async roomId => {
		await dssRemovePlayer();
		dssLeaveRoom();

		socketData.game = 'Dss';
		socket.join(roomId);

		socketData.roomId = roomId;

		if (!dssStorage.has(roomId)) {
			dssStorage.set(roomId, { roomState: {} });
		}
	});

	socket.on('leave dss [dss]', async () => {
		await dssRemovePlayer();
		dssLeaveRoom();
	});

	socket.on('disconnect', async () => {
		console.log(`Socket disconnected: ${socket.client.id}`);

		if (socketData.game === 'Coup') {
			coupRemovePlayer();
			coupLeaveRoom();
		}

		if (socketData.game === 'Dss') {
			await dssRemovePlayer();
			dssLeaveRoom();
		}
	});
});

module.exports = io;
