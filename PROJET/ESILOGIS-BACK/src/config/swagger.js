// src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ESI LOGIS",
            version: "1.0.0",
            description:
                "API for managing equipment, equipment types, and interventions",
        },
        servers: [
            {
                url: process.env.API_URL || "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    // API files to include in documentation
    apis: ["./src/features/*/*.routes.js", "./src/features/*/*.validation.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
    