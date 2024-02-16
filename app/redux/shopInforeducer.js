import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  shopData: {},
};

export const shopDataSlice = createSlice({
  name: "shopData",
  initialState,
  reducers: {
    enterShopData: (state, action) => {
      state.shopData = action.payload;
    },
  },
});

export const { enterShopData } = shopDataSlice.actions;

export default shopDataSlice.reducer;  // this is shopDataReducer
