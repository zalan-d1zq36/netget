import nodemailer from "nodemailer";

class MailerService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Check if SMTP configuration is available
            if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('SMTP configuration missing. Email notifications will be disabled.');
                return;
            }

            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                connectionTimeout: 10000, // 10 seconds
                greetingTimeout: 5000, // 5 seconds
                socketTimeout: 10000, // 10 seconds
            });

            this.isConfigured = true;
            console.log('SMTP transporter configured successfully');
        } catch (error) {
            console.error('Failed to initialize SMTP transporter:', error.message);
        }
    }

    async verifyConnection() {
        if (!this.isConfigured || !this.transporter) {
            return { success: false, message: 'SMTP not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'SMTP connection verified' };
        } catch (error) {
            console.error('SMTP verification failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    // TODO: Email küldés fejlesztendő funkciók:
    // TODO: 1. recipientName és recipientEmail paraméterek hozzáadása
    // TODO: 2. Küldő mindig SMTP_USER legyen (netgetes email)
    // TODO: 3. Személyre szabott email template a címzett nevével
    // TODO: 4. Email template előnézet funkció
    // TODO: 5. Több email template típus (informálás, árajánlat, készített)
    
    async sendOrderMail(order, recipientName = null, recipientEmail = null) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('SMTP not configured. Skipping email notification.');
            return { success: false, message: 'SMTP not configured' };
        }

        // TODO: Validálni a recipientEmail paramétert
        // TODO: Ha nincs recipientEmail megadva, használjuk a RECEIVER_EMAIL-t alapértelmezésként
        const targetEmail = recipientEmail || process.env.RECEIVER_EMAIL;
        const targetName = recipientName || 'Címzett';
        
        if (!targetEmail) {
            console.warn('No target email configured.');
            return { success: false, message: 'Cél email cím nincs megadva' };
        }

        try {
            const mailOptions = {
                from: `"Netget Szerviz" <${process.env.SMTP_USER}>`, // TODO: Mindig netgetes email
                to: targetEmail,
                subject: `Rendelés információ - ${order.customerName || 'Ismeretlen'}`, // TODO: Személyre szabott tárgy
                html: this.generateOrderEmailHtml(order, targetName), // TODO: Személyre szabott HTML
                text: this.generateOrderEmailText(order, targetName)  // TODO: Személyre szabott szöveg
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Order notification email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Failed to send order notification email:', error.message);
            return { success: false, message: error.message };
        }
    }

    // TODO: Email template fejlesztendő funkciók:
    // TODO: 1. recipientName paraméter hozzáadása a személyre szabáshoz
    // TODO: 2. Különböző template típusok (informálás, árajánlat, készített)
    // TODO: 3. Netget logó és színvillag hozzáadása
    // TODO: 4. Template előnézet funkció
    
    generateOrderEmailHtml(order, recipientName = 'Címzett') {
        return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <!-- TODO: Netget logó és fejléc hozzáadása -->
            <h2 style="color: #e74c3c;">Kedves ${recipientName}!</h2>
            <p>Rendelés információkat küldünk Önnek:</p>
            
            <h3>Ügyfél adatok:</h3>
            <ul>
                <li><strong>Név:</strong> ${order.customerName || 'N/A'}</li>
                <li><strong>Telefon:</strong> ${order.phone || 'N/A'}</li>
                <li><strong>Cím:</strong> ${order.address || 'N/A'}</li>
            </ul>
            
            <h3>Eszköz adatok:</h3>
            <ul>
                <li><strong>Típus:</strong> ${order.type || 'N/A'}</li>
                <li><strong>Gyártó:</strong> ${order.manufacturer || 'N/A'}</li>
                <li><strong>Leírás:</strong> ${order.description || 'N/A'}</li>
                <li><strong>Hiba leírása:</strong> ${order.errorDescription || 'N/A'}</li>
            </ul>
            
            <h3>Megrendelés adatok:</h3>
            <ul>
                <li><strong>Rendelésszám:</strong> ${order.orderNumber || 'N/A'}</li>
                <li><strong>Termék ID:</strong> ${order.productId || 'N/A'}</li>
                <li><strong>Megrendelő:</strong> ${order.clientName || 'N/A'}</li>
                <li><strong>Dátum:</strong> ${order.orderDate || order.actualDate || 'N/A'}</li>
            </ul>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Ez egy automatikus értesítő email. Kérjük, ne válaszoljon rá.
            </p>
        </body>
        </html>
        `;
    }

    generateOrderEmailText(order, recipientName = 'Címzett') {
        return `
Kedves ${recipientName}!

Rendelés információkat küldünk Önnek:

Ügyfél adatok:
- Név: ${order.customerName || 'N/A'}
- Telefon: ${order.phone || 'N/A'}
- Cím: ${order.address || 'N/A'}

Eszköz adatok:
- Típus: ${order.type || 'N/A'}
- Gyártó: ${order.manufacturer || 'N/A'}
- Leírás: ${order.description || 'N/A'}
- Hiba leírása: ${order.errorDescription || 'N/A'}

Megrendelés adatok:
- Rendelésszám: ${order.orderNumber || 'N/A'}
- Termék ID: ${order.productId || 'N/A'}
- Megrendelő: ${order.clientName || 'N/A'}
- Dátum: ${order.orderDate || order.actualDate || 'N/A'}

Ez egy automatikus értesítő email.
        `;
    }
}

// Export singleton instance
const mailerService = new MailerService();
export default mailerService;
