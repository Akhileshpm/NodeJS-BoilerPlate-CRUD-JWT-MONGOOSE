import mongoose from "mongoose";
import config from "../config";

export const databaseConnect = async () => {
  await mongoose.connect(config.mongoURI);
};
