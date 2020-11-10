import React, { useEffect, useContext } from 'react';
import { Route, Switch } from 'react-router-dom';
import CoupHome from './components/CoupHome';
import CoupJoin from './components/CoupJoin';
import CoupLobby from './components/CoupLobby';
import CoupRoom from './components/CoupRoom';
import NoRoom from '../components/NoRoom';
import NoPage from '../components/NoPage';
import socket from '../socket-client';
import { CoupContext } from './context/CoupState';

function CoupApp() {
	const { room, setRoom, setPlayer, addPlayer, removePlayer } = useContext(
		CoupContext
	);

	useEffect(() => {
		socket.on('update room', room => {
			setRoom(room);
		});
		socket.on('update player', player => {
			setPlayer(player);
		});
		socket.on('add player', playerName => {
			addPlayer(playerName);
		});
		socket.on('remove player', playerName => {
			removePlayer(playerName);
		});

		return () => {
			socket.off('update room');
			socket.off('update player');
			socket.off('add player');
			socket.off('remove player');
		};
	}, [setRoom, setPlayer, addPlayer, removePlayer]);

	return (
		<Switch>
			<Route
				exact
				path="/coup"
				render={({ history }) => <CoupHome history={history} />}
			/>
			<Route
				exact
				path="/coup/join"
				render={({ history }) => <CoupJoin history={history} />}
			/>
			<Route
				exact
				path="/coup/lobby"
				render={({ history }) =>
					room !== null ? <CoupLobby history={history} /> : <NoRoom />
				}
			/>
			<Route
				exact
				path="/coup/room"
				render={({ history }) =>
					room === null ? <NoRoom /> : <CoupRoom history={history} />
				}
			/>
			<Route component={NoPage} />
		</Switch>
	);
}

export default CoupApp;
