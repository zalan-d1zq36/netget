const express = require("express");
const jwt = require("jsonwebtoken");
const { addOrderToSheet } = require("../services/googleSheets");
const { sendOrderMail } = require("../services/mailer");
const router = express.Router();

// Middleware: auth
function authMiddleware(req, res, next) {
    const header = req.headers["authorization"];
    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// POST order
router.post("/", authMiddleware, async (req, res) => {
    try {
        const order = req.body;
        await addOrderToSheet(order);
        await sendOrderMail(order);
        res.json({ message: "Order saved & email sent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
