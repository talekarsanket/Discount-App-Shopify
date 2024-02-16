import mongoose from "mongoose";

// Check if the model already exists
const shopifySessionModel =
  mongoose.models.shopify_sessions ||
  mongoose.model(
    "shopify_sessions",
    new mongoose.Schema({}, { strict: false })
  );

export default shopifySessionModel;
