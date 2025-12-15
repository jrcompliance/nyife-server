const razorpay = require('../config/razorpay');
// const config = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class RazorpayService {
    /**
     * Create Payment Link for Invoice
     * @param {Object} invoiceData - Invoice details
     * @returns {Promise<Object>} Payment link details
     */
    async createPaymentLink(invoiceData) {
        try {
            const {
                invoiceId,
                amount,
                currency = 'INR',
                customerName,
                customerEmail,
                customerPhone,
                expiryInDays = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
                notes = {}
            } = invoiceData;

            // Amount must be in smallest currency unit (paise for INR)
            const amountInPaise = Math.round(amount * 100);

            // Calculate expiry timestamp (Unix)
            // const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryInDays * 24 * 60 * 60);


            const paymentLinkData = {
                amount: amountInPaise,
                currency: currency,
                accept_partial: false,
                description: `Payment for Invoice #${invoiceId}`,
                reference_id: invoiceId, // Unique reference
                // expire_by: expiryTimestamp,
                expire_by: expiryInDays,
                customer: {
                    name: customerName,
                    email: customerEmail,
                    contact: customerPhone
                },
                notify: {
                    sms: true,
                    email: true
                },
                reminder_enable: true,
                notes: {
                    invoice_id: invoiceId,
                    ...notes
                },
                // callback_url: `${config.frontendUrl}/payment/success`,
                // callback_method: 'get'
            };

            logger.info('Creating Razorpay payment link:', {
                invoiceId,
                amount: Math.round(amountInPaise / 100),
                reference_id: paymentLinkData.reference_id
            });

            const paymentLink = await razorpay.paymentLink.create(paymentLinkData);

            if (!paymentLink.id || !paymentLink.short_url) {
                throw ApiError.internal(`Failed to create payment link: ${paymentLink.message}`);
            }

            logger.info('Payment link created successfully:', {
                paymentLinkId: paymentLink.id,
                shortUrl: paymentLink.short_url
            });

            return {
                success: true,
                paymentLinkId: paymentLink.id,
                paymentShortUrl: paymentLink.short_url,
                longUrl: paymentLink.long_url,
                referenceId: paymentLink.reference_id,
                amount: paymentLink.amount,
                status: paymentLink.status,
                expiresAt: new Date(paymentLink.expire_by * 1000)
            };

        } catch (error) {
            logger.error('Error creating payment link:', error);
            throw ApiError.internal(error.message || `Failed to create payment link`);
        }
    }

    /**
     * Fetch Payment Link Details
     */
    async getPaymentLink(paymentLinkId) {
        try {
            const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);
            return paymentLink;
        } catch (error) {
            logger.error('Error fetching payment link:', error);
            throw ApiError.internal(`Failed to fetch payment link: ${error.message}`);
        }
    }

    /**
     * Cancel Payment Link
     */
    async cancelPaymentLink(paymentLinkId) {
        try {
            const result = await razorpay.paymentLink.cancel(paymentLinkId);
            logger.info('Payment link cancelled:', paymentLinkId);
            return result;
        } catch (error) {
            logger.error('Error cancelling payment link:', error);
            throw ApiError.internal(`Failed to cancel payment link: ${error.message}`);
        }
    }

    /**
     * Verify Webhook Signature
     */
    verifyWebhookSignature(webhookBody, signature, secret) {
        const crypto = require('crypto');

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(webhookBody))
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Fetch Payment Details
     */
    async getPayment(paymentId) {
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            logger.error('Error fetching payment:', error);
            throw ApiError.internal(`Failed to fetch payment: ${error.message}`);
        }
    }
}

module.exports = new RazorpayService();