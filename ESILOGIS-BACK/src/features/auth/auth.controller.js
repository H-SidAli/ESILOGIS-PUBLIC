// src/features/auth/auth.controller.js
const authService = require("./auth.service");
const { generateToken } = require("../../middleware/auth.middleware");
const passport = require("passport");
const logger = require("../../utils/logger");
const bcrypt = require("bcrypt");

// Register new user
async function register(req, res) {
    try {
        const user = await authService.registerUser(req.body);
        logger.info(`User registered successfully: ${req.body.email}`);
        res.status(201).json(user);
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
}

// Login user
async function login(req, res) {
    try {
        const user = await authService.findUserByEmail(req.body.email);
        if (
            !user ||
            !(await bcrypt.compare(req.body.password, user.passwordHash))
        ) {
            logger.warn(`Failed login attempt for email: ${req.body.email}`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = generateToken(user);
        logger.info(`User logged in successfully: ${user.email}`);
        res.json({
            success: true,
            token,
            role: user.role,
            message: "Login successful",
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

// Google login
function googleLogin(req, res, next) {
    try {
        passport.authenticate("google", { scope: ["profile", "email"] })(
            req,
            res,
            next
        );
    } catch (error) {
        logger.error(`Google login error: ${error.message}`);
        res.status(500).json({ error: "Authentication failed" });
    }
}

// Google callback
function googleAuthCallback(req, res, next) {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
            logger.error(`Google auth error: ${err.message}`);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
        }
        
        if (!user) {
            logger.warn('Google authentication failed');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
        }

        try {
            const token = generateToken(user);
            logger.info(`User authenticated via Google: ${user.email}`);
            
            // Custom redirects based on user properties
            if (user.isNewUser) {
                return res.redirect(`${process.env.FRONTEND_URL}/welcome?token=${token}&role=${user.role}`);
            }
            
            if (user.role === 'admin') {
                return res.redirect(`${process.env.FRONTEND_URL}/admin/dashboard?token=${token}`);
            }
            
            // Default successful redirect
            return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&role=${user.role}`);
        } catch (error) {
            logger.error(`Google auth callback error: ${error.message}`);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
        }
    })(req, res, next);
}

async function authSuccess(req, res) {
    try {
        const { token } = req.query;
        logger.info("Authentication successful");
        res.status(200).json({
            success: true,
            token,
            message: "Authentication successful",
        });
    } catch (error) {
        logger.error(`Auth success error: ${error.message}`);
        res.status(500).json({ error: "Error processing authentication" });
    }
}

// Logout user
function logout(req, res) {
    try {
        req.logout(function (err) {
            if (err) {
                logger.error(`Logout error: ${err.message}`);
                return res.status(500).json({ error: "Logout failed" });
            }
            logger.info("User logged out successfully");
            res.status(200).json({ message: "Logged out successfully" });
        });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({ error: "Logout failed" });
    }
}

// forgotPassword
async function forgotPassword(req, res) {
    const { email } = req.body;

    try {
        await authService.generateResetToken(email);

        // Always return success even if email doesn't exist (security)
        res.status(200).json({
            success: true,
            message:
                "If your email is registered, you will receive password reset instructions",
        });
    } catch (error) {
        logger.error(`Password reset request error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
        });
    }
}

async function resetPassword(req, res) {
    const { token, password } = req.body;

    try {
        await authService.resetPassword(token, password);

        res.status(200).json({
            success: true,
            message: "Your password has been reset successfully",
        });
    } catch (error) {
        logger.error(`Password reset error: ${error.message}`);

        // Determine appropriate status code based on error
        const statusCode = error.message.includes("token")
            ? 400
            : error.message.includes("User not found")
            ? 404
            : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    register,
    login,
    googleLogin,
    googleAuthCallback,
    authSuccess,
    logout,
    forgotPassword,
    resetPassword,
};
