const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');
const ApiError = require('./ApiError');
const Logo = require('../assets/images/nyifeWhiteLogo.png')

class EmailService {
    constructor() {
        this.transporter = null;
        this.isReady = false;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: config.smtp.host,
                port: config.smtp.port,
                secure: config.smtp.secure,
                auth: {
                    user: config.smtp.user,
                    pass: config.smtp.pass,
                },
            });

            // Verify connection with promise
            await this.transporter.verify();
            this.isReady = true;
            logger.info('SMTP server is ready to send emails');
        } catch (error) {
            this.isReady = false;
            logger.error('Failed to initialize email transporter:', error);
            // Don't throw here, allow retry on send
        }
    }

    async ensureReady() {
        if (!this.transporter || !this.isReady) {
            await this.initializeTransporter();
        }
        if (!this.isReady) {
            throw new Error('SMTP connection failed - check your configuration');
        }
    }

    async sendEmail({ to, subject, html, text, from, attachments = [] }) {
        try {
            // Ensure transporter is ready before sending
            await this.ensureReady();

            if (!this.transporter) {
                throw ApiError.internal('Email service not initialized');
            }

            const mailOptions = {
                from: from || `"${config.smtp.fromName}" <${config.smtp.from}>`,
                to,
                subject,
                text: text || undefined,
                html: html || text,
                attachments,
            };

            logger.info('Attempting to send email with options:', {
                to: mailOptions.to,
                from: mailOptions.from,
                subject: mailOptions.subject
            });

            const info = await this.transporter.sendMail(mailOptions);

            logger.info(`Email sent successfully to ${to}: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                response: info.response,
            };
        } catch (error) {
            // Log the actual error details
            logger.error('Failed to send email - Full error:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode,
                stack: error.stack
            });

            // Throw with the actual error message
            throw ApiError.internal(`Failed to send email: ${error.message}`);
        }
    }

    async sendInvoiceEmail(invoice) {
        try {
            // Validate required fields
            if (!invoice.email) {
                throw new Error('Invoice email is required');
            }
            if (!invoice.invoice_type) {
                throw new Error('Invoice type is required');
            }
            if (!invoice.invoice_number) {
                throw new Error('Invoice number is required');
            }

            logger.info('Preparing to send invoice email:', {
                to: invoice.email,
                type: invoice.invoice_type,
                number: invoice.invoice_number
            });

            const html = this.getInvoiceEmailTemplate(invoice);

            return await this.sendEmail({
                to: invoice.email,
                subject: `${invoice.invoice_type} #${invoice.invoice_number} from Complia Services`,
                html,
                attachments: [
                    {
                        filename: `${invoice.invoice_type}_${invoice.invoice_number}.pdf`,
                        path: invoice.invoice_url,
                    },
                ]
            });
        } catch (error) {
            logger.error('Error in sendInvoiceEmail:', {
                message: error.message,
                stack: error.stack,
                invoice: {
                    email: invoice.email,
                    type: invoice.invoice_type,
                    number: invoice.invoice_number
                }
            });
            throw error;
        }
    }

    getInvoiceEmailTemplate(invoice) {
        return `

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            border-radius: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }

        .container {
            max-width: 600px;
            margin: 1rem;
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border:1px solid #EEEEEE;


        }

        .header {
            background: #ff5100;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0px 0px;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
            line-height: 1.3;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            margin-bottom: 25px;
        }

        .greeting h2 {
            color: #ff5100;
            font-size: 18px;
            margin-bottom: 15px;
            line-height: 1.4;
        }

        .greeting p {
            color: #666;
            font-size: 14px;
            line-height: 1.7;
            margin-bottom: 12px;
        }

        .button-container {
            text-align: center;
            margin: 25px 0;
            color: white;
        }

        .button {
            display: inline-block;
            background-color: #ff5100;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
        }

        .footer {
            background-color: #ff5100;
            padding: 25px 20px;
            text-align: center;
            font-size: 12px;
            color: white;
            border-top: 1px solid #e5e7eb;
            border-radius: 0px 0px 8px 8px;
        }

        .footer p {
            margin: 6px 0;
            line-height: 1.6;
        }

        .footer strong {
            font-size: 13px;
        }

        .footer-thank-you {
            margin-top: 15px;
            color: rgba(255,255,255,0.8);
            font-size: 11px;
        }

        @media only screen and (max-width: 768px) {
            body { padding: 5px; }
            .header { padding: 25px 15px; }
            .header h1 { font-size: 22px; }
            .header p { font-size: 13px; }
            .content { padding: 25px 15px; }
            .greeting h2 { font-size: 17px; }
            .greeting p { font-size: 13px; }
            .button { padding: 12px 24px; font-size: 13px; }
            .footer { padding: 20px 15px; font-size: 11px; }
        }

        @media only screen and (max-width: 480px) {
            body { padding: 0; }
            .container { box-shadow: none; }
            .header { padding: 20px 15px; }
            .header h1 { font-size: 20px; margin-bottom: 6px; }
            .header p { font-size: 12px; }
            .content { padding: 20px 15px; }
            .greeting { margin-bottom: 20px; }
            .greeting h2 { font-size: 16px; margin-bottom: 12px; }
            .greeting p { font-size: 13px; line-height: 1.6; margin-bottom: 10px; }
            .button-container { margin: 20px 0; }
            .button { display: block; width: 100%; max-width: 280px; margin: 0 auto; padding: 14px 20px; font-size: 14px; }
            .footer { padding: 20px 15px; font-size: 11px; }
            .footer p { margin: 5px 0; line-height: 1.5; }
            .footer strong { font-size: 12px; }
            .footer-thank-you { margin-top: 12px; font-size: 10px; }
        }

        @media only screen and (max-width: 360px) {
            .header h1 { font-size: 18px; }
            .header p { font-size: 11px; }
            .greeting h2 { font-size: 15px; }
            .greeting p { font-size: 12px; }
            .button { font-size: 13px; padding: 12px 18px; }
            .footer { font-size: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src=${Logo} alt="nyife" height="100" style="padding:1rem;" />
            <h1>Complia Services Ltd</h1>
            <p>${invoice.invoice_type} #${invoice.invoice_number}</p>
        </div>

        <div class="content">
            <div class="greeting">
                <h2>Hello ${invoice.customer_name || 'Valued Customer'},</h2>
                <div>
                    <p>Thank you for considering our services. We appreciate the opportunity to work with you and look forward to building a long-term partnership.</p>
                    <p>Your ${invoice.invoice_type?.toLowerCase() || 'document'} is ready. Please find the details below.</p>
                    <p><strong>Best regards,</strong><br>Nyife Team</p>
                </div>
            </div>

            ${invoice.payment_url && invoice.invoice_type === "Proforma" ? `
            <div class="button-container">
                <a href="${invoice.payment_url}" download class="button">Click to pay</a>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p><strong>Complia Services Ltd</strong></p>
            <p>Plot no.9, Third Floor, Paschim Vihar Extn.</p>
            <p>Email: info@nyife.chat | Phone: +91 11 430 22 315</p>
            <p>Website: nyife.chat</p>
            <p class="footer-thank-you">Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
    
    `;
    }
}

module.exports = new EmailService();