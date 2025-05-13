// app.js - Express configuration and middleware setup
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const logger = require("./src/utils/logger");
require("dotenv").config();
const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const swaggerSpec = require("./src/config/swagger");
require("./src/config/passport");

// Import routes
const appRoutes = require("./src/app.routes");

// Initialize express app
const app = express();

// Security and optimization middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        credentials: true,
    })
);
app.use(compression());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // Rate limiting
// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: "Too many requests from this IP, please try again later",
// });
// app.use("/api/", apiLimiter);

app.use(passport.initialize());

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

// Mount all routes
app.use("/", appRoutes);

// Root route
app.get("/", (req, res) => {
    res.send(
        'API is running... Check out <a href="/api-docs">API Documentation</a>'
    );
});

// async function sendSMS(to, body){
//     try {
//         const message = await client.messages.create({
//             body,
//             from: process.env.TWILIO_PHONE_NUMBER,
//             to,
//         });
//         return message;
//     } catch (error) {
//         logger.error("Error sending SMS:", error);
//         throw new Error("Error sending SMS");
//     }
// }

// sendSMS("+213540026451", "Salam mn 3nd VANGUARD");

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        error: "Server error",
        message:
            process.env.NODE_ENV === "development"
                ? err.message
                : "An unexpected error occurred",
    });
});

module.exports = app;
