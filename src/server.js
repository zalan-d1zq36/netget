import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import router from "./routes/orders.js";
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add this to parse form data
app.use(express.static("public")); // Serve frontend files

// Node.js __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy login (for MVP)
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.USER && process.env.PWD) {
        const token = jwt.sign({ username }, "asdfasdf", { expiresIn: "1h" });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Orders endpoint
app.use("/order", router);

export default app;
