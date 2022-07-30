import { createSlice } from '@reduxjs/toolkit';

const myPlayerSlice = createSlice({
  name: 'myPlayer',
  initialState: null,
  reducers: {
    setMyPlayer(state, action) {
      return action.payload;
    },
    setVotedFor(state, action) {
      state.votedFor = action.payload;
    },
  },
});

export const { setMyPlayer } = myPlayerSlice.actions;

export default myPlayerSlice.reducer;
