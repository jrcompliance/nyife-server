const razorpayService = require('../services/razorpay.service');
const invoiceService = require('../services/invoice.service');
const config = require('../config/env');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class WebhookController {
    /**
     * Handle Razorpay Webhook Events
     * POST /api/webhooks/razorpay
     */
    handleRazorpayWebhook = async (req, res) => {
        try {
            const webhookSignature = req.headers['x-razorpay-signature'];
            const webhookBody = req.body;

            // Verify webhook signature
            const isValid = razorpayService.verifyWebhookSignature(
                webhookBody,
                webhookSignature,
                config.razorpay.webhookSecret
            );

            if (!isValid) {
                logger.error('Invalid webhook signature');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid signature'
                });
            }

            const event = webhookBody.event;
            const payload = webhookBody.payload;

            logger.info('Webhook received:', {
                event,
                accountId: webhookBody.account_id,
                eventId: req.headers['x-razorpay-event-id']
            });

            // Handle different webhook events
            switch (event) {
                case 'payment_link.paid':
                    await this.handlePaymentLinkPaid(payload);
                    break;

                case 'payment_link.expired':
                    await this.handlePaymentLinkExpired(payload);
                    break;

                default:
                    logger.info('Unhandled webhook event:', event);
            }


            return res.status(200).json(ApiResponse.success(null, 'Webhook processed'));

        } catch (error) {
            logger.error('Error processing webhook:', error);

            return res.status(200).json(ApiResponse.success(null, 'Webhook processing error'));
        }
    }

    /**
     * Handle payment_link.paid event
     */
    handlePaymentLinkPaid = async (payload) => {
        try {
            const paymentLink = payload.payment_link.entity;
            const payment = payload.payment.entity;

            logger.info('Payment link paid:', {
                paymentLinkId: paymentLink.id,
                paymentId: payment.id,
                amount: payment.amount
            });

            // Extract invoice ID from notes
            const invoiceId = paymentLink.notes?.invoice_id;

            if (!invoiceId) {
                logger.error('Invoice ID not found in payment link notes');
                return;
            }

            // Update invoice status
            await invoiceService.updatePaymentStatus(invoiceId, {
                paymentId: payment.id,
                razorpayPaymentId: payment.id,
                method: payment.method,
                signature: null, // Not available in webhook
                metadata: {
                    amount_paid: payment.amount / 100,
                    currency: payment.currency,
                    status: payment.status,
                    email: payment.email,
                    contact: payment.contact,
                    payment_link_id: paymentLink.id
                }
            });

            logger.info('Invoice updated successfully for payment:', {
                invoiceId,
                paymentId: payment.id
            });

        } catch (error) {
            logger.error('Error handling payment_link.paid:', error);
            throw error;
        }
    }

    /**
     * Handle payment_link.expired event
     */
    handlePaymentLinkExpired = async (payload) => {
        try {
            const paymentLink = payload.payment_link.entity;
            const invoiceId = paymentLink.notes?.invoice_id;

            logger.info('Payment link expired:', {
                paymentLinkId: paymentLink.id,
                referenceId: paymentLink.reference_id
            });

            // Update invoice status or send reminder
            await invoiceService.updatePaymentStatusToExpired(invoiceId);


        } catch (error) {
            logger.error('Error handling payment_link.expired:', error);
        }
    }
}

module.exports = new WebhookController();