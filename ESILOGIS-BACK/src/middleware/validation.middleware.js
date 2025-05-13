// src/middleware/validation.middleware.js - Request validation middleware
const { validationResult } = require("express-validator");

// Middleware to validate requests
const validate = (validations = []) => {
    return async (req, res, next) => {
        // Check if validations is an array before mapping
        if (!Array.isArray(validations)) {
            return next();
        }

        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            errors: errors.array(),
        });
    };
};

module.exports = { validate };
