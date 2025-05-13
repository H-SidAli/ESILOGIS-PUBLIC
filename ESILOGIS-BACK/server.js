// server.js - Application entry point
require("dotenv").config();
const app = require("./app");
const { PrismaClient } = require("@prisma/client");
const logger = require("./src/utils/logger");
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(
        `API Documentation available at http://localhost:${PORT}/api-docs`
    );
});

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database connections closed");
        process.exit(0);
    });
});

process.on("SIGINT", async () => {
    logger.info("SIGINT signal received: closing HTTP server");
    server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database connections closed");
        process.exit(0);
    });
});
