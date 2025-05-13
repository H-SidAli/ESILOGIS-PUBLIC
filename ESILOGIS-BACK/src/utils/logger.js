// src/utils/logger.js
const winston = require("winston");

// Define log format
const logFormat = winston.format.printf(
    ({ level, message, timestamp, ...meta }) => {
        return `${timestamp} ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
        }`;
    }
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                logFormat
            ),
        }),
    ],
});

// Add file transports in production
if (process.env.NODE_ENV === "production") {
    logger.add(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        })
    );
    logger.add(
        new winston.transports.File({
            filename: "logs/combined.log",
        })
    );
}

module.exports = logger;
