import express from "express";
import jwt from "jsonwebtoken";
import { appendOrder } from "../services/sqliteStorage.js";
import sendOrderMail from "../services/mailer.js";

const router = express.Router();

// Middleware: auth
function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];
    console.log("Authorization Header:", header); // Log the header
    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(" ")[1]; // Extract the token after "Bearer"
    console.log("Token:", token); // Log the token

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Verified User:", req.user); // Log the verified user
        next();
    } catch {
        console.error("Token verification failed:", err); // Log the error
        return res.status(401).json({ message: "Invalid token" });
    }
};

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Hibás adatok" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// POST order
router.post("/", authMiddleware, async (req, res) => {
    try {
        const order = req.body;
        console.log("Received order:", order);
        // Map the order fields to match the database columns
        const row = [
            order.mlpsz || "",
            order.actualDate || "",
            order.orderDate || "",
            order.customerName || "",
            order.phone || "",
            order.address || "",
            order.description || "",
            order.type || "",
            order.manufacturer || "",
            order.errorDescription || "",
            order.purchaseDate || "",
            order.orderNumber || "",
            order.productId || "",
            order.factoryNumber || "",
            order.serialNumber || "",
            order.note || "",
            order.status || "",
            order.technician || "",
            order.invoice || "",
        ];
        console.log("Received row:", row); // Log the received data

        const orderId = await appendOrder(row);
        await sendOrderMail(row);
        res.json({ message: "Order saved to SQLite & email sent", orderId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;