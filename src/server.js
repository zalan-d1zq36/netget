import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import ordersRouter from "./routes/orders.js";
import authRouter from "./routes/auth.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


console.log("Environment variables loaded:", {
    JWT_SECRET: process.env.JWT_SECRET,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD
});


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// Auth routes
app.use("/auth", authRouter);

// Orders endpoint
app.use("/order", ordersRouter);

export default app;
