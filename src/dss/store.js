import { configureStore } from '@reduxjs/toolkit';
import myPlayerReducer from './myPlayerSlice';
import roomReducer from './roomSlice';

const store = configureStore({
  devTools: { name: 'Drunk, Stoned, or Stupid' },
  reducer: { myPlayer: myPlayerReducer, room: roomReducer },
});

export default store;
