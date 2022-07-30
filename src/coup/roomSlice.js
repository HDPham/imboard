import { createSlice } from '@reduxjs/toolkit';

const roomSlice = createSlice({
  name: 'room',
  initialState: null,
  reducers: {
    setRoom(state, action) {
      return action.payload;
    },
    addPlayer(state, action) {
      state.players = state.players.concat(action.payload);
    },
    removePlayer(state, action) {
      state.players = state.players.filter(
        (player) => player._id !== action.payload,
      );
    },
  },
});

export const { setRoom, addPlayer, removePlayer } = roomSlice.actions;

export default roomSlice.reducer;
