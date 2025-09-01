import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendOrderMail(order) {
    await transporter.sendMail({
        from: `"Netget" <${process.env.SMTP_USER}>`,
        to: process.env.RECEIVER_EMAIL,
        subject: "Új megrendelés",
        text: `Új megrendelés érkezett: ${JSON.stringify(order)}`,
    });
}

export default sendOrderMail;
