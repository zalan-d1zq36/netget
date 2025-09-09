import dotenv from "dotenv";
console.log(dotenv.config()); // Load .env FIRST

const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD
};

export default config;