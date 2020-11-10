import React, { createContext, useReducer } from 'react';
import AppReducer from './AppReducer';

// Initial state
const initialState = {
	/** 
		{
			_id: String, 
			code: String, 
			players: Array [Object {name: String, isReady: Boolean}], 
			judgeIndex: Number, 
			inProgress: Boolean
		}
	*/
	room: null,
	currPlayer: null // { name: String, chosenPlayerName: String }
};

// Create context
export const DssContext = createContext(initialState);

// Provider component
export const DssProvider = ({ children }) => {
	const [state, dispatch] = useReducer(AppReducer, initialState);

	// Actions
	function setRoom(room) {
		dispatch({
			type: 'SET_ROOM',
			payload: room
		});
	}

	function setPlayer(player) {
		dispatch({
			type: 'SET_PLAYER',
			payload: player
		});
	}

	function updateRoomAllClients(room) {
		dispatch({
			type: 'UPDATE_ROOM_ALL_CLIENTS',
			payload: room
		});
	}

	function removePlayer() {
		dispatch({
			type: 'REMOVE_PLAYER'
		});
	}

	return (
		<DssContext.Provider
			value={{
				room: state.room,
				currPlayer: state.currPlayer,
				judgeName: state.room?.players[state.room.judgeIndex]?.name ?? '',
				setRoom,
				setPlayer,
				updateRoomAllClients,
				removePlayer
			}}
		>
			{children}
		</DssContext.Provider>
	);
};
