import socket from '../../socket-client';

const AppReducer = (state, action) => {
	switch (action.type) {
		case 'SET_ROOM':
			return {
				...state,
				room: action.payload
			};
		case 'SET_PLAYER':
			return {
				...state,
				currPlayer: action.payload
			};
		case 'UPDATE_ROOM_ALL_CLIENTS':
			fetch('/api/rooms', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json;charset=UTF-8'
				},
				body: JSON.stringify(action.payload)
			});
			socket.emit('update room (all clients) [dss]', action.payload);

			return state;
		case 'REMOVE_PLAYER':
			if (state.currPlayer === null) {
				if (state.room !== null) {
					socket.emit('leave room [dss]');
				}

				return state;
			}

			const updatedRoom = {
				...state.room,
				players: state.room.players.filter(
					player => player.name !== state.currPlayer.name
				)
			};

			if (state.room.inProgress) {
				const removedPlayerIndex = state.room.players.findIndex(
					player => player.name === state.currPlayer.name
				);

				if (removedPlayerIndex < state.room.judgeIndex) {
					updatedRoom.judgeIndex--;
				} else if (state.room.judgeIndex >= state.room.players.length - 1) {
					updatedRoom.judgeIndex = 0;
				}
			}

			fetch('/api/rooms', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json;charset=UTF-8'
				},
				body: JSON.stringify(updatedRoom)
			});

			socket.emit('update room (all clients) [dss]', updatedRoom);
			socket.emit('set player name [dss]', '');
			socket.emit('leave room [dss]');

			return {
				...state,
				currPlayer: null
			};
		default:
			return state;
	}
};

export default AppReducer;
