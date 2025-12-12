const invoiceService = require('../services/invoice.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class InvoiceController {
    createInvoice = asyncHandler(async (req, res) => {
        const invoice = await invoiceService.createInvoice(req.body);
        res.status(201).json(ApiResponse.created(invoice, 'Invoice created successfully'));
    });

    generateProformaInvoice = asyncHandler(async (req, res) => {
        const invoice = await invoiceService.generateProformaInvoice(req.params.id);
        res.json(ApiResponse.created(invoice, 'Proforma invoice generated successfully'));
    });

    getInvoice = asyncHandler(async (req, res) => {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        res.json(ApiResponse.success(invoice, 'Invoice retrieved successfully'));
    });

    updateInvoice = asyncHandler(async (req, res) => {
        const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
        res.json(ApiResponse.success(invoice, 'Invoice updated successfully'));
    });

    deleteInvoice = asyncHandler(async (req, res) => {
        await invoiceService.deleteInvoice(req.params.id);
        res.json(ApiResponse.success(null, 'Invoice deleted successfully'));
    });

    deleteAllInvoice = asyncHandler(async (req, res) => {
        await invoiceService.deleteAllInvoice();
        res.json(ApiResponse.success(null, 'All invoices deleted successfully'));
    });

    getAllInvoices = asyncHandler(async (req, res) => {
        const result = await invoiceService.getAllInvoices(req.query);
        res.json(ApiResponse.success(result, 'Invoices retrieved successfully'));
    });
}

module.exports = new InvoiceController();