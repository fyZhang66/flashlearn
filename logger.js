import pino from "pino";

const level = process.env.LOG_LEVEL || "info";

const logger = pino({
  level,
  base: {
    service: process.env.OTEL_SERVICE_NAME || "flashlearn",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
