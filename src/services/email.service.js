const ApiError = require('../utils/ApiError');
const emailService = require('../utils/email-service'); // Import the entire service instance
const logger = require('../utils/logger');

class EmailService {

    async sendInvoice(data) {
        const { customer_name, invoice_type, invoice_number, invoice_url, payment_url, email } = data;

        if (!customer_name || !invoice_type || !invoice_number || !invoice_url || !email) {
            throw ApiError.badRequest('Invalid data');
        }

        try {
            const result = await emailService.sendInvoiceEmail({
                customer_name,
                invoice_type,
                invoice_number,
                invoice_url,
                payment_url,
                email,
            });

            if (result.success) {
                logger.info('Invoice email sent successfully', {
                    to: email,
                    messageId: result.messageId
                });
                return result;
            } else {
                logger.error('Failed to send email - no success flag');
                throw ApiError.internal('Failed to send email');
            }
        } catch (error) {
            logger.error('Failed to send invoice email:', {
                message: error.message,
                stack: error.stack,
                email: email,
                invoice_type: invoice_type,
                invoice_number: invoice_number
            });
            throw ApiError.internal(`Failed to send email: ${error.message}`);
        }
    }
}

module.exports = new EmailService();