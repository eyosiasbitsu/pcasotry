// config/auth.js

require('dotenv').config(); // Load environment variables from a .env file

// Expose our config directly to our application
module.exports = {
    googleAuth: {
        clientID: process.env.GOOGLE_CLIENT_ID || "default-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "default-client-secret",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
    }
};
