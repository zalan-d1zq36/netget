import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './auth.js';
import pdfService from '../services/pdfService.js';
import sqliteStorage from '../services/sqliteStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper: get order by ID using shared service
async function getOrderById(orderId) {
    return await sqliteStorage.getOrderById(orderId);
}

// Helper: permission check
function isAdmin(user) {
    return user && (user.role === '[ADMIN]' || user.role === 'admin');
}
function isEmployee(user) {
    return user && (user.role === '[NETGET_EMPLOYEE]' || user.role === 'employee');
}
function canGeneratePDF(user) {
    return isAdmin(user) || isEmployee(user);
}

// PDF endpoint generator
function pdfEndpoint(type, generatorFn, permissionFn = canGeneratePDF) {
    router.get(`/${type}/:orderId`, authMiddleware, async (req, res) => {
        try {
            const { orderId } = req.params;
            const user = req.user;
            if (!permissionFn(user)) {
                return res.status(403).json({ error: 'Nincs jogosultság PDF generáláshoz' });
            }
            const order = await getOrderById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Megrendelés nem található' });
            }
            const pdfBuffer = await generatorFn(order, user.name);
            const filename = pdfService.generateFileName(order, type);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': pdfBuffer.length,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(pdfBuffer, 'binary');
        } catch (error) {
            console.error(`${type} PDF generation error:`, error);
            res.status(500).json({ error: `Hiba a ${type} PDF generálása során`, details: error.message });
        }
    });
}

// Register endpoints for each PDF type
pdfEndpoint('invoice', (order, user) => pdfService.generateInvoicePDF(order, user));
pdfEndpoint('offer', (order, user) => pdfService.generateOfferPDF(order, user));
pdfEndpoint('kiadni', (order, user) => pdfService.generateKiadniPDF(order, user));
pdfEndpoint('worksheet', (order, user) => pdfService.generateWorksheetPDF(order, user));

// Optionally: preview endpoints (inline display)
function pdfPreviewEndpoint(type, generatorFn, permissionFn = canGeneratePDF) {
    router.get(`/preview/${type}/:orderId`, authMiddleware, async (req, res) => {
        try {
            const { orderId } = req.params;
            const user = req.user;
            if (!permissionFn(user)) {
                return res.status(403).json({ error: 'Nincs jogosultság PDF megtekintéshez' });
            }
            const order = await getOrderById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Megrendelés nem található' });
            }
            const pdfBuffer = await generatorFn(order, user.name);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline',
                'Content-Length': pdfBuffer.length,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            });
            res.end(pdfBuffer, 'binary');
        } catch (error) {
            console.error(`${type} PDF preview error:`, error);
            res.status(500).json({ error: `Hiba a ${type} PDF előnézet során`, details: error.message });
        }
    });
}

pdfPreviewEndpoint('invoice', (order, user) => pdfService.generateInvoicePDF(order, user));
pdfPreviewEndpoint('offer', (order, user) => pdfService.generateOfferPDF(order, user));
pdfPreviewEndpoint('kiadni', (order, user) => pdfService.generateKiadniPDF(order, user));
pdfPreviewEndpoint('worksheet', (order, user) => pdfService.generateWorksheetPDF(order, user));

export default router;
