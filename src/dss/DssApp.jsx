import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import DssHome from './components/DssHome';
import DssJoin from './components/DssJoin';
import DssLobby from './components/DssLobby';
import DssRoom from './components/DssRoom';
import NoRoom from '../components/NoRoom';
import NoPage from '../components/NoPage';
import { setRoom, addPlayer, removePlayer } from './roomSlice';
import { setMyPlayer } from './myPlayerSlice';
import { dssSocket as socket } from '../socketClient';

function DssApp() {
  const room = useSelector((state) => state.room);
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on('set room', (room) => {
      dispatch(setRoom(room));
    });
    socket.on('add player', (player) => {
      dispatch(addPlayer(player));
    });
    socket.on('remove player', (playerId) => {
      dispatch(removePlayer(playerId));
    });
    socket.on('set my player', (myPlayer) => {
      dispatch(setMyPlayer(myPlayer));
    });
    socket.on('disconnect', () => {
      dispatch(setRoom(null));
      dispatch(setMyPlayer(null));
    });

    return () => {
      socket.off('set room');
      socket.off('add player');
      socket.off('remove player');
      socket.off('set my player');
      socket.off('disconnect');
    };
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<DssHome />} />
      <Route path="/join" element={<DssJoin />} />
      <Route
        path="/lobby"
        element={room !== null ? <DssLobby /> : <NoRoom />}
      />
      <Route path="/room" element={room !== null ? <DssRoom /> : <NoRoom />} />
      <Route element={<NoPage />} />
    </Routes>
  );
}

export default DssApp;
