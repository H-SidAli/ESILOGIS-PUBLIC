// src/features/auth/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authService = require("./auth.service");

const {
    authenticate,
    generateToken,
} = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validation.middleware");
const {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} = require("./auth.validation");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", validate(registerValidation), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post("/login", validate(loginValidation), authController.login);

// Google Auth routes
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleAuthCallback);

// Test route for Google auth - add this to authRoutes.js
router.get("/google/mock", async (req, res) => {
    try {
        // Create a mock Google profile
        const mockProfile = {
            id: "123456789",
            displayName: "Test User",
            emails: [{ value: "testuser2@gmail.com" }],
        };

        // Process through your service
        const user = await authService.findOrCreateGoogleUser(mockProfile);

        // Generate token just like the real flow
        const token = generateToken(user);

        // Redirect to success page
        res.redirect(`/auth/success?token=${token}`);
    } catch (error) {
        console.error("Mock auth error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Logout route
router.post("/logout", authController.logout);

// sucess route for Google auth
router.get("/success", authController.authSuccess);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
    "/forgot-password",
    forgotPasswordValidation,
    authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Invalid input or token
 *       500:
 *         description: Server error
 */
router.post(
    "/reset-password",
    resetPasswordValidation,
    authController.resetPassword
);

module.exports = router;
