const AppReducer = (state, action) => {
	switch (action.type) {
		case 'SET_ROOM':
			return {
				...state,
				room: action.payload
			};
		case 'ADD_PLAYER':
			return {
				...state,
				room: {
					...state.room,
					players: [
						...state.room.players,
						{
							name: action.payload,
							numCoins: 2,
							numCards: 2,
							faceUps: [],
							isEliminated: false
						}
					]
				}
			};
		case 'SET_PLAYER':
			return {
				...state,
				currPlayer: action.payload
			};
		default:
			return state;
	}
};

export default AppReducer;
