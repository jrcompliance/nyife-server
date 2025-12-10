const ApiError = require('../utils/ApiError');
const database = require('../config/database');
const fileUpload = require('../utils/fileUpload');
const logger = require('../utils/logger');

class UploadService {
    getInvoice() {
        return database.getModels().Invoice;
    }

    async upload(data, uploadedFile) {
        const Invoice = this.getInvoice();
        const sequelize = database.getSequelize();

        let savedFile = null;
        let transaction = null;

        try {
            const { id, pdf_type } = data;

            // Validate inputs
            if (!id) throw ApiError.badRequest('Invoice ID is required');
            if (!uploadedFile) throw ApiError.badRequest('PDF file is required');
            if (!uploadedFile.buffer) throw ApiError.badRequest('Invalid file data');
            if (!['quotation', 'proforma', 'payment'].includes(pdf_type)) {
                throw ApiError.badRequest('Invalid PDF type. Must be quotation, proforma, or payment');
            }

            // Start transaction
            transaction = await sequelize.transaction();

            // Check if invoice exists
            const invoice = await Invoice.findByPk(id, { transaction });
            if (!invoice) {
                throw ApiError.notFound('Invoice not found');
            }

            // Get old PDF URL to delete later
            const oldPdfUrl = pdf_type === 'quotation'
                ? invoice.quotation_invoice_pdf_url
                : pdf_type === 'proforma'
                    ? invoice.proforma_invoice_pdf_url
                    : invoice.payment_invoice_pdf_url;

            // Save new PDF file
            const originalName = uploadedFile.originalname || 'document.pdf';
            savedFile = await fileUpload.savePDF(uploadedFile.buffer, originalName, pdf_type);

            // Prepare update data
            const updateData = {};
            if (pdf_type === 'quotation') {
                updateData.quotation_invoice_pdf_url = savedFile.url;
            } else if (pdf_type === 'proforma') {
                updateData.proforma_invoice_pdf_url = savedFile.url;
            } else if (pdf_type === 'payment') {
                updateData.payment_invoice_pdf_url = savedFile.url;
            }

            // Update invoice
            await invoice.update(updateData, { transaction });

            // Commit transaction
            await transaction.commit();

            // Delete old PDF file (if exists and different from new one)
            if (oldPdfUrl && oldPdfUrl !== savedFile.url) {
                await fileUpload.deleteByUrl(oldPdfUrl).catch(err => {
                    logger.warn('Failed to delete old PDF:', err);
                });
            }

            logger.info(`PDF uploaded successfully for invoice ${id}: ${savedFile.filename}`);

            return {
                invoice: await Invoice.findByPk(id),
                file: {
                    url: savedFile.url,
                    downloadUrl: `${savedFile.url}/download`,
                    filename: savedFile.filename,
                    size: savedFile.size,
                    type: savedFile.type,
                    uploadedAt: savedFile.uploadedAt,
                },
            };

        } catch (error) {
            // Rollback transaction
            if (transaction) {
                await transaction.rollback();
            }

            // Delete uploaded file if save succeeded but DB update failed
            if (savedFile && savedFile.filename) {
                await fileUpload.deletePDF(savedFile.filename).catch(cleanupErr => {
                    logger.error('Failed to cleanup uploaded file:', cleanupErr);
                });
            }

            if (data?.id) {
                await Invoice.destroy({ where: { id: data.id } }).catch(destroyErr => {
                    logger.error('Failed to delete invoice row:', destroyErr);
                });
            }

            logger.error('Upload service error:', error);

            if (error instanceof ApiError) throw error;
            throw ApiError.internal('Failed to upload PDF');
        }
    }
}

module.exports = new UploadService();