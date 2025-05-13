// src/middleware/auth.middleware.js - Authentication middleware
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../utils/logger");

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
};

// Verify JWT token
const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = decoded;
        if (!user) {
            throw new Error("User not found");
        }

        return {
            valid: true,
            expired: false,
            user,
        };
    } catch (error) {
        return {
            valid: false,
            expired: error.message === "jwt expired",
            user: null,
        };
    }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "You are not logged in! Please log in to get access.",
            });
        }

        const { valid, expired, user } = await verifyToken(token);

        if (!valid) {
            return res.status(401).json({
                status: "fail",
                message: expired ? "Token expired" : "Invalid token",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        res.status(500).json({
            status: "error",
            message: "Authentication failed",
        });
    }
};

// Authorization middleware to restrict access based on role
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                status: "fail",
                message: "User authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}`);
            return res.status(403).json({
                status: "fail",
                message: "You do not have permission to perform this action",
            }); 
        }
        
        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    restrictTo,
};