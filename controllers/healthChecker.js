import mongoose from "mongoose";
import logger from "../logger";

const OK = "ok";
const NOK = "nok";

const healthChecker = (req, res) => {
  logger.info("Starting health check");
  try {
    const status = {
      api_service: OK,
      database: mongoose.connection.readyState ? OK : NOK,
    };
    logger.info("Health check completed");
    res.send(status);
  } catch (error) {
    logger.error("Health check failed");
    res.status(500).send();
  }
};

export default { healthChecker };
