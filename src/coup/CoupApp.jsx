import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import CoupHome from './components/CoupHome';
import CoupJoin from './components/CoupJoin';
import CoupLobby from './components/CoupLobby';
import CoupRoom from './components/CoupRoom';
import NoRoom from '../components/NoRoom';
import NoPage from '../components/NoPage';
import { setRoom, addPlayer, removePlayer } from './roomSlice';
import {
  setMyPlayer,
  setCards,
  addCards,
  keepCards,
  setIsEliminated,
} from './myPlayerSlice';
import { coupSocket as socket } from '../socketClient';

function CoupApp() {
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
    socket.on('set my cards', (cards) => {
      dispatch(setCards(cards));
    });
    socket.on('add my cards', (cards) => {
      dispatch(addCards(cards));
    });
    socket.on('keep my cards', (cardIndexes) => {
      dispatch(keepCards(cardIndexes));
    });
    socket.on('set my elimination status', (isEliminated) => {
      dispatch(setIsEliminated(isEliminated));
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
      socket.off('set my cards');
      socket.off('add my cards');
      socket.off('keep my cards');
      socket.off('set my elimination status');
      socket.off('disconnect');
    };
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<CoupHome />} />
      <Route path="/join" element={<CoupJoin />} />
      <Route
        path="/lobby"
        element={room !== null ? <CoupLobby /> : <NoRoom />}
      />
      <Route path="/room" element={room !== null ? <CoupRoom /> : <NoRoom />} />
      <Route element={NoPage} />
    </Routes>
  );
}

export default CoupApp;
