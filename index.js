import 'dotenv/config';
import express from "express";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./routes";
import { databaseConnect } from "./database/mongoose";
import passportStrategy from "./services/passport";
import logger from './logger';

const PORT = process.env.PORT || 5000;
const app = express();
app.use(
  cors({
    exposedHeaders: ["x-auth-token"],
  })
);
app.use(bodyParser.json());
passportStrategy(passport);

routes(app, passport);

databaseConnect().then(() => {
  logger.info("Database connected");
  app.listen(PORT, () => {
    logger.info(`server running on PORT: ${PORT}`);
  });
});
