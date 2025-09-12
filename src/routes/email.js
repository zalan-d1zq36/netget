import express from 'express';
import { authMiddleware, requirePermission } from './auth.js';
import sqliteStorage from '../services/sqliteStorage.js';
import mailerService from '../services/mailer.js';

const router = express.Router();

// TODO: Email küldés fejlesztendő funkciók:
// TODO: 1. Modal ablak címzett nevének és email címének megadásához
// TODO: 2. Validáció az email címre
// TODO: 3. Küldő mindig a netgetes email legyen (SMTP_USER)
// TODO: 4. Személyre szabott email sablon a címzett nevével
// TODO: 5. Email előnézet funkció küldés előtt

// Send order notification email
router.post('/send-order/:orderId', authMiddleware, requirePermission('edit_orders'), async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        
        if (isNaN(orderId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Érvénytelen rendelés azonosító' 
            });
        }

        // TODO: Itt kell fogadni a címzett nevét és email címét a request body-ból:
        // const { recipientName, recipientEmail } = req.body;
        
        // Get order details
        const order = await sqliteStorage.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rendelés nem található' 
            });
        }

        // TODO: Módosítani a mailerService.sendOrderMail() metódust:
        // - recipientName és recipientEmail paraméterek hozzáadása
        // - küldő mindig SMTP_USER legyen
        // - személyre szabott email template
        
        // Send email
        const result = await mailerService.sendOrderMail(order);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Email sikeresen elküldve',
                messageId: result.messageId 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: result.message || 'Email küldési hiba' 
            });
        }
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Szerver hiba az email küldése során' 
        });
    }
});

// Test email configuration endpoint (admin only)
router.get('/test-config', authMiddleware, requirePermission('admin'), async (req, res) => {
    try {
        const result = await mailerService.verifyConnection();
        res.json(result);
    } catch (error) {
        console.error('Email config test error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Hiba az email konfiguráció tesztelése során' 
        });
    }
});

export default router;
