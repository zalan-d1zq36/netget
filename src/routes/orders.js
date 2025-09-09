import express from "express";
import { authMiddleware } from "./auth.js"; // Import the shared middleware
import { appendOrder } from "../services/sqliteStorage.js";
import sendOrderMail from "../services/mailer.js";

const OrderRouter = express.Router();

// POST order
OrderRouter.post("/", authMiddleware, async (req, res) => {
    try {
        const order = req.body;
        console.log("Received order:", order);

        const orderId = await appendOrder(order);
        //await sendOrderMail(order);
        res.json({ message: "Order saved to SQLite & email sent", orderId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

OrderRouter.get("/", authMiddleware, async (req, res) => {
    // Only allow admin
    if (req.user.email !== process.env.USERNAME) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
export default OrderRouter;