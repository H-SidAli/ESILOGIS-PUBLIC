// src/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../utils/logger");
const authService = require("../features/auth/auth.service");


// Add serialization/deserialization for sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.userAccount.findUnique({
            where: { id: id },
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(         
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3001/auth/google/callback",
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                if (!profile || !profile.emails || !profile.emails[0]) {
                    return done(new Error('Invalid profile data from Google'), null);
                }

                const user = await authService.findOrCreateGoogleUser(profile);
                return done(null, user);
            } catch (error) {
                console.error("Error in Google authentication:", error);
                return done(error, null);
            }
        }
    )
);

module.exports = passport;