const ApiError = require('../utils/ApiError');
const { Op, fn, col, literal } = require('sequelize');
const database = require('../config/database');
const razorpayService = require('./razorpay.service');
const { sanitizePhoneNumber } = require('../utils/phoneNumber');
const logger = require('../utils/logger');
class InvoiceService {
    getInvoice() {
        return database.getModels().Invoice;
    }

    async createInvoice(invoiceData) {
        const Invoice = this.getInvoice();

        // Defensive helpers
        const toNumber = v => {
            if (v === undefined || v === null || v === '') return 0;
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;

        // extract / normalize inputs
        const platformCharge = toNumber(invoiceData.platform_charge);
        const walletRecharge = toNumber(invoiceData.wallet_recharge);
        const setupFee = toNumber(invoiceData.setup_fee);
        const customizationFee = toNumber(invoiceData.customization_fee);
        const GSTpercent = toNumber(invoiceData.GST); // e.g. 18
        const discountInput = toNumber(invoiceData.discount); // could be percent or absolute

        // sum additional fees (expects array of { description, amount })
        let additionalFeeTotal = 0;
        if (Array.isArray(invoiceData.additional_fee)) {
            additionalFeeTotal = invoiceData.additional_fee.reduce((acc, item) => {
                return acc + toNumber(item && item.amount);
            }, 0);
        }

        // subtotal
        const sub_total_raw = platformCharge + walletRecharge + setupFee + customizationFee + additionalFeeTotal;
        const sub_total = round2(sub_total_raw);

        // discount logic:
        // - if discountInput is between 0 and 100 (inclusive) treat as percent
        // - otherwise treat as absolute amount
        let discount_amount_raw;
        if (discountInput >= 0 && discountInput <= 100) {
            discount_amount_raw = (sub_total_raw * (discountInput / 100));
        } else {
            discount_amount_raw = discountInput; // absolute
        }
        // don't allow negative discount or discount greater than subtotal
        discount_amount_raw = Math.max(0, Math.min(discount_amount_raw, sub_total_raw));
        const discount_amount = round2(discount_amount_raw);

        // amount after discount
        const amount_after_discount_raw = sub_total_raw - discount_amount_raw;
        const amount_after_discount = round2(amount_after_discount_raw);

        // GST amount applied on amount_after_discount
        const GST_amount_raw = amount_after_discount_raw * (GSTpercent / 100);
        const GST_amount = round2(GST_amount_raw);

        // total
        const total_raw = amount_after_discount_raw + GST_amount_raw;
        const total = round2(total_raw);

        const ProcessedInvoiceData = {
            ...invoiceData,
            sub_total,
            discount_amount,
            amount_after_discount,
            GST_amount,
            total,
            // auto generate before saving
            quotation_number: `QI${Date.now()}${Math.floor(Math.random() * 1000)}`,
            quotation_date: new Date().toISOString().split('T')[0],
            quotation_valid_until_date: invoiceData.quotation_valid_until_date.split('T')[0],
        };

        const invoice = await Invoice.create(ProcessedInvoiceData);
        return invoice;
    }

    async generateProformaInvoice(invoiceId, invoiceData) {
        const Invoice = this.getInvoice();
        const invoice = await Invoice.findByPk(invoiceId);
        const { proforma_valid_until_date, payment_terms } = invoiceData;

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        // Convert proforma_valid_until_date to Unix timestamp
        const proformaExpiryDate = Math.floor(
            new Date(proforma_valid_until_date).getTime() / 1000
        );


        // Generate Razorpay payment link
        const proformaNumber = `PI${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const phoneNumber = sanitizePhoneNumber(invoice.phone, invoice.phone.match(/^\+\d+/)?.[0]);
        const paymentLinkResult = await razorpayService.createPaymentLink({
            invoiceId: proformaNumber,
            amount: invoice.total,
            currency: "INR",
            customerName: invoice.customer_name,
            customerEmail: invoice.email,
            customerPhone: phoneNumber,
            expiryInDays: proformaExpiryDate,
            notes: {
                invoice_id: invoice.id,
                notes: {}
            },
        });

        // Update invoice with payment link details
        invoice.proforma_invoice = true;
        invoice.payment_terms = payment_terms;
        invoice.proforma_number = proformaNumber;
        invoice.proforma_date = new Date().toISOString().split('T')[0];
        invoice.proforma_valid_until_date = proforma_valid_until_date.split('T')[0],
            invoice.payment_url = {
                payment_link_id: paymentLinkResult.paymentLinkId,
                payment_link_short_url: paymentLinkResult.paymentShortUrl,
                payment_link_long_url: paymentLinkResult.longUrl,
                payment_link_reference_id: paymentLinkResult.referenceId,
                payment_link_expires_at: paymentLinkResult.expiresAt
            }

        // Save invoice
        await invoice.save();


        return invoice;
    }

    async updatePayment(invoiceId, paymentData) {
        const Invoice = this.getInvoice();

        try {
            const invoice = await Invoice.findByPk(invoiceId);

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            await invoice.update({
                payment_receipt: true,
                payment_status: 'paid',
                payment_id: paymentData.payment_id,
                payment_method: paymentData.payment_method,
                paid_at: new Date(paymentData.paid_at),
                payment_metadata: paymentData.payment_metadata || {}
            });

            logger.info('Payment updated:', {
                invoiceId,
                paymentId: paymentData.payment_id
            });

            return invoice;

        } catch (error) {
            logger.error('Error updating payment:', error);
            throw ApiError.internal(error.message || 'Failed to update payment');
        }
    }

    /**
      * Update Invoice Payment Status
      */
    async updatePaymentStatus(invoiceId, paymentData) {
        const Invoice = this.getInvoice();

        try {
            const invoice = await Invoice.findByPk(invoiceId);

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const paymentsMethods = {
                card: "Card",
                netbanking: "Net Banking",
                wallet: "Wallet",
                emi: "EMI",
                upi: "UPI"
            }

            await invoice.update({
                payment_receipt: true,
                payment_status: 'paid',
                payment_id: paymentData.paymentId,
                payment_method: paymentsMethods[paymentData.method] || paymentData.method,
                paid_at: new Date(),
                razorpay_payment_id: paymentData.razorpayPaymentId,
                razorpay_signature: paymentData.signature,
                payment_metadata: paymentData.metadata || {}
            });

            logger.info('Invoice payment status updated:', {
                invoiceId,
                paymentId: paymentData.paymentId
            });

            return invoice;

        } catch (error) {
            logger.error('Error updating payment status:', error);
            throw ApiError.internal(error.message || 'Failed to update payment status');
        }
    }

    async updatePaymentStatusToExpired(invoiceId) {
        const Invoice = this.getInvoice();

        try {
            const invoice = await Invoice.findByPk(invoiceId);

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            await invoice.update({
                payment_status: 'expired',
            });

            logger.info('Invoice payment status updated to expired:', {
                invoiceId,
            });

            return invoice;

        } catch (error) {
            logger.error('Error updating payment status to expired:', error);
            throw ApiError.internal(error.message || 'Failed to update payment status to expired');
        }
    }

    async getInvoiceById(invoiceId) {
        const Invoice = this.getInvoice();

        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        return invoice;
    }

    async updateInvoice(invoiceId, updateData) {
        const Invoice = this.getInvoice();
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        await invoice.update(updateData);

        return invoice;
    }

    async deleteInvoice(invoiceId) {
        const Invoice = this.getInvoice();
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        await invoice.destroy();

        return invoice;
    }

    async deleteAllInvoice(invoiceId) {
        const Invoice = this.getInvoice();
        try {
            const invoice = await Invoice.destroy({
                where: {},
                force: true // Bypass soft delete, permanently delete
            });
            return invoice;
        } catch (error) {
            throw ApiError.internal(error.message || 'Failed to delete all invoices');
        }
    }

    async getAllInvoices(query) {
        try {
            const Invoice = this.getInvoice();
            const { page = 1, limit = 10, sort = 'created_at', order = 'DESC', paymentStatus, platformChargeType, startDate, endDate, search, createdBy } = query;
            const where = {};

            if (paymentStatus) {
                where.payment_status = paymentStatus;
            }
            if (platformChargeType) {
                where.platform_charge_type = platformChargeType;
            }
            if (startDate && endDate) {
                where.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
            if (createdBy) {
                where[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }
            if (search) {
                where[Op.or] = [
                    { company_name: { [Op.like]: `%${search}%` } },
                    { contact_person: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { quotation_number: { [Op.like]: `%${search}%` } },
                    { proforma_number: { [Op.like]: `%${search}%` } },
                    { payment_id: { [Op.like]: `%${search}%` } },
                    { gst_number: { [Op.like]: `%${search}%` } },
                ];
            }

            const offset = (page - 1) * limit;

            const { count, rows: invoices } = await Invoice.findAndCountAll({
                where,
                raw: true,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [[sort, order]],
            });


            // Total Revenue
            const revenueData = await Invoice.findOne({
                attributes: [
                    [fn('SUM', col('total')), 'totalRevenue'],
                    [fn('SUM', col('wallet_recharge')), 'walletRevenue'],
                    [fn('SUM', col('discount_amount')), 'totalDiscount'],
                    [fn('SUM', col('GST_amount')), 'totalGST']
                ],
                where: where,
                raw: true
            });

            // Payment Status Breakdown
            const paymentStatusCount = await Invoice.findAll({
                attributes: [
                    'payment_status',
                    [fn('COUNT', col('id')), 'count'],
                    [fn('SUM', col('total')), 'amount']
                ],
                where: where,
                group: ['payment_status'],
                raw: true
            });

            // Total Invoices
            const totalInvoices = await Invoice.count({ where: where });

            // Paid vs Unpaid
            const paidInvoices = paymentStatusCount.find(s => s.payment_status === 'paid') || { count: 0, amount: 0 };
            const unpaidInvoices = paymentStatusCount.find(s => s.payment_status === 'unpaid') || { count: 0, amount: 0 };

            return {
                invoices,
                stats: {
                    totalRevenue: parseFloat(revenueData.totalRevenue || 0),
                    walletRevenue: parseFloat(revenueData.walletRevenue || 0),
                    totalGST: parseFloat(revenueData.totalGST || 0),
                    totalDiscount: parseFloat(revenueData.totalDiscount || 0),
                    totalInvoices,
                    paidInvoices: {
                        count: parseInt(paidInvoices.count),
                        amount: parseFloat(paidInvoices.amount || 0)
                    },
                    unpaidInvoices: {
                        count: parseInt(unpaidInvoices.count),
                        amount: parseFloat(unpaidInvoices.amount || 0)
                    }
                },
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                totalInvoices: count,
            };
        } catch (error) {
            console.error('Error fetching invoices:', error);
            throw ApiError.internal(error.message || 'Failed to fetch invoices');
        }


    }

}

module.exports = new InvoiceService();