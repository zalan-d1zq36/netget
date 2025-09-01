import express from "express";
import bodyParser from "body-parser";
import { appendOrder } from "./services/googleSheets.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // frontend kiszolgálás

// Node.js __dirname pótlás ESM-ben
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Sheet azonosító
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Dummy login (csak MVP-re)
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.USER && process.env.PWD) {
        return res.json({ success: true, token: "fake-jwt-token" });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Megrendelés endpoint
app.post("/order", async (req, res) => {
    try {
        const { customerName, description, date } = req.body;

        await appendOrder(SPREADSHEET_ID, [
            new Date().toISOString(),
            customerName,
            description,
            date,
        ]);

        res.status(200).json({ message: "Order saved to Google Sheets" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save order" });
    }
});

export default app;
