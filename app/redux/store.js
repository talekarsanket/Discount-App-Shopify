import { configureStore } from "@reduxjs/toolkit";
import shopDataReducer from "./shopInforeducer";

const store = configureStore({
  reducer: {
    shopData: shopDataReducer,
  },
});

export default store;
