import mongoose from "mongoose";

const dbconnection = async () => {
  try {
    console.log("hiiiii");
    await mongoose.connect("mongodb://localhost:27017/Automatic-BxGy-Discount");
    console.log("Database is connected");
    return;
  } catch (error) {
    console.log("============ error ============", error);
    return;
  }
};

export default dbconnection();
