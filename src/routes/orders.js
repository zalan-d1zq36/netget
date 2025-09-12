import express from "express";
import { body, validationResult } from "express-validator";
import { authMiddleware, requirePermission } from "./auth.js";
import sqliteStorage from "../services/sqliteStorage.js";
import mailerService from "../services/mailer.js";

const OrderRouter = express.Router();

// Validation + sanitization rules for order creation
const orderValidationRules = () => {
    return [
        body('clientName').trim().notEmpty().withMessage('Client name is required').isLength({ max: 255 }).escape(),
        body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 255 }).escape(),
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone is required')
            .isLength({ max: 50 })
            .customSanitizer(v => (v || '').replace(/[\s-]/g, ''))
            .matches(/^(\+?\d{6,15})$/).withMessage('Invalid phone format'),
        body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 500 }).escape(),
        body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 500 }).escape(),
        body('type').trim().notEmpty().withMessage('Type is required').isLength({ max: 255 }).escape(),
        body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required').isLength({ max: 255 }).escape(),
        body('errorDescription').trim().notEmpty().withMessage('Error description is required').isLength({ max: 1000 }).escape(),
        body('orderDate').isISO8601().withMessage('Invalid order date format'),
        body('purchaseDate').isISO8601().withMessage('Invalid purchase date format'),
        body('orderNumber').trim().notEmpty().withMessage('Order number is required').isLength({ max: 100 }).escape(),
        body('productId').trim().notEmpty().withMessage('Product ID is required').isLength({ max: 100 }).escape(),
        body('factoryNumber').trim().notEmpty().withMessage('Factory number is required').isLength({ max: 100 }).escape(),
        body('serialNumber').trim().notEmpty().withMessage('Serial number is required').isLength({ max: 100 }).escape(),
        body('note').optional().trim().isLength({ max: 1000 }).escape()
    ];
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// POST order
OrderRouter.post("/", authMiddleware, orderValidationRules(), validate, async (req, res) => {
    try {
        const order = req.body;
        // Add actual date automatically
        order.actualDate = new Date().toISOString().slice(0, 10);
        
        // Set default values for admin-only fields
        order.status = order.status || 'Beérkezett';
        order.technician = order.technician || 'Nincs hozzárendelve';
        order.invoice = order.invoice || 'Nincs';
        
        const orderId = await sqliteStorage.appendOrder(order);
        
        // TODO: Email küldés csak gombnyomásra, ne automatikusan
        // TODO: Email küldésnél címzett nevének és email címének megadása
        // TODO: Küldő email mindig a netgetes legyen (SMTP_USER)
        
        res.json({ message: "Order saved successfully", orderId });
    } catch (err) {
        console.error('Order creation error:', err.message);
        res.status(500).json({ message: "Failed to save order" });
    }
});

OrderRouter.get("/", authMiddleware, requirePermission('view_database'), async (req, res) => {
    try {
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Validate parameters
        if (page < 1) {
            return res.status(400).json({ message: "Page must be >= 1" });
        }
        
        if (![20, 50, 100].includes(limit)) {
            return res.status(400).json({ message: "Limit must be 20, 50, or 100" });
        }
        
        const result = await sqliteStorage.getAllOrders(page, limit);
        res.json(result);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ message: "Failed to retrieve orders" });
    }
});

// Update specific fields of an order (admin/employee only)
const updateValidationRules = () => {
    return [
        body('status').optional().trim().isLength({ max: 100 }).escape(),
        body('technician').optional().trim().isLength({ max: 255 }).escape(),
        body('invoice').optional().trim().isLength({ max: 255 }).escape(),
        body('note').optional().trim().isLength({ max: 1000 }).escape()
    ];
};

OrderRouter.put("/:id", authMiddleware, requirePermission('edit_orders'), updateValidationRules(), validate, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const updates = req.body;
        
        // Only allow certain fields to be updated
        const allowedFields = ['status', 'technician', 'invoice', 'note'];
        const filteredUpdates = {};
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        }
        
        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }
        
        await sqliteStorage.updateOrder(orderId, filteredUpdates);
        res.json({ message: "Order updated successfully" });
    } catch (err) {
        console.error('Order update error:', err.message);
        res.status(500).json({ message: "Failed to update order" });
    }
});

// Delete an order (admin only)
OrderRouter.delete("/:id", authMiddleware, requirePermission('delete_orders'), async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        await sqliteStorage.deleteOrder(orderId);
        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error('Order deletion error:', err.message);
        res.status(500).json({ message: "Failed to delete order" });
    }
});

export default OrderRouter;
