import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
    constructor() {
        this.templatesPath = path.join(__dirname, '../../templates');
        this.browser = null;
    }

    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Helper function to format date in Hungarian format
    formatHungarianDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Helper function to format datetime in Hungarian format
    formatHungarianDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Prepare order data with proper field mapping for templates
    prepareOrderData(order) {
        return {
            // Basic customer info
            customerName: order.customerName || 'N/A',
            phone: order.phone || 'N/A',
            address: order.address || 'N/A',
            
            // Device info
            type: order.deviceType || order.type || 'N/A',
            manufacturer: order.manufacturer || 'N/A',
            description: order.description || 'N/A',
            
            // Order details - VÉGLEG JAVÍTOTT MEGFELELTETÉS
            orderNumber: order.orderNumber || 'N/A',                    // Rendelésszám = order ID
            productId: order.productId || 'N/A',                      // Termék ID = RENDELÉSSZÁM (order ID)
            mlpsz: order.id || 'N/A',                          // MLPSZ = order ID (mint munkalap szám)
            errorDescription: order.issueDescription || order.errorDescription || 'N/A',
            
            // Service details
            technician: order.technician || 'N/A',
            
            // Financial info - JAVÍTOTT: csak invoice van, bruttó = nettó * 1.27
            szla: order.invoice || '0 Ft',
            szlaBrutto: order.invoice ? `${Math.round(parseFloat(order.invoice.toString().replace(/[^0-9.-]/g, '')) * 1.27)} Ft` : '0 Ft',
            
            // Dates
            orderDate: this.formatHungarianDate(order.actualDate || order.createdAt),
            currentDate: this.formatHungarianDate(new Date()),
            currentDateTime: this.formatHungarianDateTime(new Date())
        };
    }

    // Add CSS styling to HTML
    addPDFStyling(html) {
        const style = `
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                margin: 0;
                padding: 20px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                font-size: 11px;
            }
            th, td {
                border: 1px solid #000;
                padding: 8px 12px;
                text-align: left;
                vertical-align: top;
            }
            th {
                background-color: #f5f5f5;
                font-weight: bold;
                text-align: center;
            }
            p {
                margin: 10px 0;
                line-height: 1.6;
            }
            .company-header {
                text-align: center;
                margin-bottom: 30px;
                font-size: 14px;
                font-weight: bold;
            }
            .document-title {
                font-size: 16px;
                font-weight: bold;
                text-decoration: underline;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                margin-top: 40px;
                font-size: 11px;
            }
            .signature {
                margin-top: 30px;
                text-align: right;
            }
        </style>
        `;
        
        return style + html;
    }

    async generatePDF(order, templateType = 'invoice', generatedBy = 'Rendszer') {
        try {
            // Map template types to actual template files
            const templateMap = {
                'invoice': 'invoice.html',
                'kiadni': 'kiadni.html', 
                'offer': 'offer.html',
                'worksheet': 'worksheet.html'
            };

            const templateFile = templateMap[templateType];
            if (!templateFile) {
                throw new Error(`Ismeretlen template típus: ${templateType}`);
            }

            // Prepare order data
            const orderData = this.prepareOrderData(order);
            orderData.generatedBy = generatedBy;

            // Load and compile template
            const templatePath = path.join(this.templatesPath, templateFile);
            const templateSource = await fs.readFile(templatePath, 'utf-8');
            
            // Compile template with Handlebars
            const template = Handlebars.compile(templateSource);
            let html = template(orderData);
            
            // Add styling
            html = this.addPDFStyling(html);

            // Initialize browser and generate PDF
            const browser = await this.initializeBrowser();
            const page = await browser.newPage();

            await page.setContent(html, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const pdfOptions = {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '15mm',
                    bottom: '15mm',
                    left: '12mm',
                    right: '12mm'
                }
            };

            const pdf = await page.pdf(pdfOptions);
            await page.close();

            return pdf;

        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error(`PDF generálási hiba: ${error.message}`);
        }
    }

    // Generate specific PDF types
    async generateInvoicePDF(order, generatedBy = 'Rendszer') {
        return this.generatePDF(order, 'invoice', generatedBy);
    }

    async generateKiadniPDF(order, generatedBy = 'Rendszer') {
        return this.generatePDF(order, 'kiadni', generatedBy);
    }

    async generateOfferPDF(order, generatedBy = 'Rendszer') {
        return this.generatePDF(order, 'offer', generatedBy);
    }

    async generateWorksheetPDF(order, generatedBy = 'Rendszer') {
        return this.generatePDF(order, 'worksheet', generatedBy);
    }

    // Generate filename for PDF
    generateFileName(order, templateType = 'invoice') {
        const date = new Date().toISOString().slice(0, 10);
        const orderId = order.id || 'ismeretlen';
        
        const prefixMap = {
            'invoice': 'szamla',
            'kiadni': 'kiadni',
            'offer': 'ajanlat',
            'worksheet': 'munkalap'
        };
        
        const prefix = prefixMap[templateType] || 'dokumentum';
        return `${prefix}-${orderId}-${date}.pdf`;
    }

    // Health check for the PDF service
    async healthCheck() {
        try {
            const browser = await this.initializeBrowser();
            const page = await browser.newPage();
            await page.setContent('<html><body><h1>Test</h1></body></html>');
            await page.pdf({ format: 'A4' });
            await page.close();
            return { healthy: true, message: 'PDF szolgáltatás működik' };
        } catch (error) {
            return { healthy: false, message: error.message };
        }
    }
}

// Export singleton instance
export default new PDFService();
