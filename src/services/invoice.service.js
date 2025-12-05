const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');
const { Op } = require('sequelize');
const database = require('../config/database');

class InvoiceService {
    getInvoice() {
        return database.getModels().Invoice;
    }

    async createInvoice(invoiceData) {
        const Invoice = this.getInvoice();
        console.log("invoiceData", invoiceData);
        const invoice = await Invoice.create(invoiceData);
        return invoice;
    }

    async getInvoiceById(invoiceId) {
        const Invoice = this.getInvoice();
        const cacheKey = `invoice:${invoiceId}`;
        const cached = await cache.get(cacheKey);

        if (cached) return cached;

        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        await cache.set(cacheKey, invoice, 600);
        return invoice;
    }

    async updateInvoice(invoiceId, updateData) {
        const Invoice = this.getInvoice();
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        await invoice.update(updateData);
        await cache.del(`invoice:${invoiceId}`);

        return invoice;
    }

    async deleteInvoice(invoiceId) {
        const Invoice = this.getInvoice();
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            throw ApiError.notFound('Invoice not found');
        }

        await invoice.destroy();
        await cache.del(`invoice:${invoiceId}`);

        return invoice;
    }

    async getAllInvoices(query) {
        const Invoice = this.getInvoice();
        const { page = 1, limit = 10, sort = 'created_at', order = 'DESC', search } = query;

        const where = {};
        if (search) {
            where[Op.or] = [
                { company_name: { [Op.like]: `%${search}%` } },
                { contact_person: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { quotation_number: { [Op.like]: `%${search}%` } },

            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows: invoices } = await Invoice.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sort, order]],
        });

        return {
            invoices,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalInvoices: count,
        };
    }
}

module.exports = new InvoiceService();