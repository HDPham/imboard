import React, { createContext, useReducer } from 'react';
import AppReducer from './AppReducer';

// Initial state
const initialState = {
	/** 
		{
			code: String, 
			players: Array [Object {
				name: String, 
				numCoins: Number, 
				numCards: Number, 
				faceUps: Array [String], 
				isEliminated: Boolean
			}], 
			turnIndex: Number, 
			inProgress: Boolean
		}
	*/
	room: null,
	currPlayer: null // {name: String, cards: Array [String], isEliminated: Boolean}
};

// Create context
export const CoupContext = createContext(initialState);

// Provider component
export const CoupProvider = ({ children }) => {
	const [state, dispatch] = useReducer(AppReducer, initialState);

	// Actions
	function setRoom(room) {
		dispatch({
			type: 'SET_ROOM',
			payload: room
		});
	}

	function addPlayer(name) {
		dispatch({
			type: 'ADD_PLAYER',
			payload: name
		});
	}

	function setPlayer(player) {
		dispatch({
			type: 'SET_PLAYER',
			payload: player
		});
	}

	return (
		<CoupContext.Provider
			value={{
				room: state.room,
				currPlayer: state.currPlayer,
				setRoom,
				addPlayer,
				setPlayer
			}}
		>
			{children}
		</CoupContext.Provider>
	);
};
