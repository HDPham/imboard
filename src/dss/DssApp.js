import React, { useEffect, useContext } from 'react';
import { Route, Switch } from 'react-router-dom';
import DssHome from './components/DssHome';
import DssJoin from './components/DssJoin';
import DssLobby from './components/DssLobby';
import DssRoom from './components/DssRoom';
import NoRoom from '../components/NoRoom';
import NoPage from '../components/NoPage';
import socket from '../socket-client';
import { DssContext } from './context/DssState';

function DssApp() {
	const { room, setRoom } = useContext(DssContext);

	useEffect(() => {
		socket.on('update room', room => {
			setRoom(room);
		});

		return () => {
			socket.off('update room');
		};
	}, [setRoom]);

	return (
		<Switch>
			<Route
				exact
				path="/dss"
				render={({ history }) => <DssHome history={history} />}
			/>
			<Route
				exact
				path="/dss/join"
				render={({ history }) => <DssJoin history={history} />}
			/>
			<Route
				exact
				path="/dss/lobby"
				render={({ history }) =>
					room !== null ? <DssLobby history={history} /> : <NoRoom />
				}
			/>
			<Route
				exact
				path="/dss/room"
				component={room !== null ? DssRoom : NoRoom}
			/>
			<Route component={NoPage} />
		</Switch>
	);
}

export default DssApp;
