// src/features/auth/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient, Role } = require("@prisma/client");
const logger = require("../../utils/logger");
const { sendEmail } = require("../notifications/notifications.service");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();

// Register a new user
async function registerUser({ email, password, role }) {
    // Check if user already exists
    const existingUser = await prisma.userAccount.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.userAccount.create({
        data: {
            email,
            passwordHash: hashedPassword,
            role,
        },
    });
    if (user) {
        logger.info(`User registered: ${email}`);
    } else {
        logger.error(`User registration failed: ${email}`);
    }
    return user;
}

async function findUserByEmail(email) {
    return prisma.userAccount.findUnique({ where: { email } });
}

async function findOrCreateGoogleUser(profile) {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    // Try to find the user by email first
    const existingUser = await prisma.userAccount.findUnique({
        where: { email },
    });

    if (existingUser) {
        logger.info(`User found: ${email}`);
        return existingUser;
    }

    // If not found, create a new user with Google ID and email
    logger.info(`User not found, creating new user: ${email}`);

    const newUser = await prisma.userAccount.create({
        data: {
            googleId,
            email,
            role: Role.USER,
        },
    });

    logger.info(`New user created: ${newUser.email}`);
    return newUser;
}


async function generateResetToken(email) {
    // getting the user
    const user = await prisma.userAccount.findUnique({
        where: { email },
    });

    if(!user){
        logger.warn(`Password reset attempt for non-existing user: ${email}`);
        throw new Error("User not found");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Create simple JWT with user ID and timestamp to make tokens unique
    const resetToken = jwt.sign(
        {
            id: user.id, // Use email as ID for simplicity
            purpose: "password_reset",
            timestamp: Date.now(), // Add timestamp to make each token unique
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send the reset email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        template: "password-reset",
        text: `Click the link to reset your password: ${resetUrl}`,
    });

    logger.info(`Password reset email sent to: ${email}`);
    return { success: true };
}

async function resetPassword(token, newPassword) {
    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.purpose !== "password_reset") {
            throw new Error("Invalid token purpose");
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user's password
        await prisma.userAccount.update({
            where: { id: decoded.id },
            data: { passwordHash },
        });

        logger.info(`Password reset successful for user ID: ${decoded.id}`);
        return { success: true };
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            logger.warn(`Invalid password reset attempt: ${error.message}`);
            throw new Error("Invalid or expired token");
        }
        logger.error(`Password reset error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    registerUser,
    findUserByEmail,
    findOrCreateGoogleUser,
    generateResetToken,
    resetPassword,
};
