import dotenv from "dotenv";
dotenv.config(); // Load .env FIRST

function validateRequiredConfig() {
    const required = ["JWT_SECRET"]; // Critical for auth
    const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === "");

    if (missing.length > 0) {
        // Fail fast if critical env vars are missing
        // Do not print actual values
        console.error("Missing required environment variables:", missing.join(", "));
        process.exit(1);
    }

    // Basic strength check for JWT secret
    if ((process.env.JWT_SECRET || "").length < 32) {
        console.error("JWT_SECRET must be at least 32 characters long.");
        process.exit(1);
    }
}

validateRequiredConfig();

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    RECEIVER_EMAIL: process.env.RECEIVER_EMAIL,
};

export default config;
