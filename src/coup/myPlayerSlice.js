import { createSlice } from '@reduxjs/toolkit';

const myPlayerSlice = createSlice({
  name: 'myPlayer',
  initialState: null,
  reducers: {
    setMyPlayer(state, action) {
      return action.payload;
    },
    setCards(state, action) {
      state.cards = action.payload;
    },
    addCards(state, action) {
      state.cards = [...state.cards, ...action.payload];
    },
    keepCards(state, action) {
      state.cards = state.cards.filter((card, index) =>
        action.payload.includes(index),
      );
    },
    removeCard(state, action) {
      state.cards = state.cards.filter(
        (card, index) => index !== action.payload,
      );
    },
    setIsEliminated(state, action) {
      state.isEliminated = action.payload;
    },
  },
});

export const {
  setMyPlayer,
  setCards,
  addCards,
  keepCards,
  removeCard,
  setIsEliminated,
} = myPlayerSlice.actions;

export default myPlayerSlice.reducer;
