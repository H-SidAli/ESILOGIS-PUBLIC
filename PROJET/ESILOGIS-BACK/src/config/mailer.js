// In src/config/mailer.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// Create a single reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Export the transporter and helper functions
module.exports = {
    sendMail: async (options) => {
        try {
            const transporter = createTransporter();
            const info = await transporter.sendMail(options);
            logger.info(`Email sent: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error("Error sending email", {
                error: error.message,
                stack: error.stack,
                code: error.code
            });
            throw error;
        }
    }
};