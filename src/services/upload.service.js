const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache');
const { Op } = require('sequelize');
const database = require('../config/database');
const fileUpload = require('../utils/fileUpload');
const invoiceService = require('./invoice.service');
// const logger = require('../utils/logger');

class UploadService {
    getInvoice() {
        return database.getModels().Invoice;
    }

    // async upload(data, file) {

    //     const { id, pdf_type } = data;
    //     const { originalname, buffer } = file;


    //     if (!pdf_data) {
    //         throw ApiError.badRequest('PDF data is required');
    //     }

    //     if (!['quotation', 'proforma', 'payment'].includes(pdf_type)) {
    //         throw ApiError.badRequest('Invalid PDF type. Must be quotation, proforma, or payment');
    //     }

    //     // Save PDF
    //     const file = await fileUpload.saveBufferPDF(buffer, originalname, pdf_type);

    //     // Update invoice with PDF URL
    //     const updateData = {};

    //     if (pdf_type === 'quotation') {
    //         updateData.quotation_invoice_pdf_url = file.url;
    //     } else if (pdf_type === 'proforma') {
    //         updateData.proforma_invoice_pdf_url = file.url;
    //     } else if (pdf_type === 'payment') {
    //         updateData.payment_invoice_pdf_url = file.url;
    //     }

    //     const updated_invoice = await invoiceService.updateInvoice(id, updateData);

    //     return {
    //         invoice: updated_invoice,
    //         file: {
    //             url: file.url,
    //             filename: file.filename,
    //             size: file.size,
    //         }
    //     };
    // }

    // assume: const fileUpload = require('./path/to/fileUploadManager');
    // and invoiceService is imported/available, ApiError/logger also available

    async upload(data = {}, uploadedFile) {
        try {
            const { id, pdf_type } = data;
            if (!id) {
                throw ApiError.badRequest('Invoice id is required');
            }

            if (!uploadedFile || !uploadedFile.buffer) {
                throw ApiError.badRequest('PDF file is required');
            }

            const { originalname, buffer } = uploadedFile;

            if (!['quotation', 'proforma', 'payment'].includes(pdf_type)) {
                throw ApiError.badRequest('Invalid PDF type. Must be quotation, proforma, or payment');
            }

            // Save PDF (avoid variable name collision)
            const savedFile = await fileUpload.saveBufferPDF(buffer, originalname, pdf_type);

            // Prepare update payload
            const updateData = {};
            if (pdf_type === 'quotation') {
                updateData.quotation_invoice_pdf_url = savedFile.url;
            } else if (pdf_type === 'proforma') {
                updateData.proforma_invoice_pdf_url = savedFile.url;
            } else if (pdf_type === 'payment') {
                updateData.payment_invoice_pdf_url = savedFile.url;
            }

            // Update invoice record
            const updated_invoice = await invoiceService.updateInvoice(id, updateData);

            return {
                invoice: updated_invoice,
                file: {
                    url: savedFile.url,
                    filename: savedFile.filename,
                    size: savedFile.size
                }
            };
        } catch (err) {
            // Log and wrap unexpected errors
            // logger.error('Error in upload:', err);
            if (err instanceof ApiError) throw err;
            throw ApiError.internal('Failed to upload PDF');
        }
    }

}

module.exports = new UploadService();