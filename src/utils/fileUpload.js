const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('./logger');
const ApiError = require('./ApiError');

class FileUploadManager {
    constructor() {
        this.uploadDir = path.join(process.cwd(), config.upload.dir);
        this.invoicesDir = path.join(this.uploadDir, 'invoices');
        this.ensureDirectories();
    }

    ensureDirectories() {
        // Create upload directories if they don't exist
        [this.uploadDir, this.invoicesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`Created directory: ${dir}`);
            }
        });
    }

    // Returns { isDataUri: boolean, base64Part?: string }
    _extractBase64Part(dataUri) {
        if (!dataUri || typeof dataUri !== 'string') return { isDataUri: false };

        // Accept data URIs like:
        // data:application/pdf;base64,AAAA...
        // data:application/pdf;filename=foo.pdf;base64,AAAA...
        // data:application/pdf;param1=val1;filename=foo.pdf;base64,AAAA...
        const prefixRegex = /^data:application\/pdf(?:;[^,]*)?;base64,/i;
        if (!prefixRegex.test(dataUri)) return { isDataUri: false };

        // split at first comma to allow optional params before ;base64
        const parts = dataUri.split(',');
        if (parts.length < 2) return { isDataUri: false };

        const base64Part = parts.slice(1).join(','); // in case comma appears (very unlikely)
        return { isDataUri: true, base64Part };
    }

    validateBase64(dataUri) {
        if (!dataUri || typeof dataUri !== 'string') {
            throw ApiError.badRequest('Invalid base64 string');
        }

        const { isDataUri } = this._extractBase64Part(dataUri);
        if (!isDataUri) {
            throw ApiError.badRequest('File must be a PDF in base64 data URI format');
        }

        return true;
    }

    _validateBufferIsPdf(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw ApiError.badRequest('Provided file is not a buffer');
        }

        // Check magic header '%PDF-'
        try {
            const header = buffer.slice(0, 5).toString('utf8');
            if (header !== '%PDF-') {
                throw ApiError.badRequest('Uploaded file is not a valid PDF');
            }
        } catch (err) {
            throw ApiError.badRequest('Uploaded file is not a valid PDF');
        }

        // Check size
        if (buffer.length > config.upload.maxFileSize) {
            throw ApiError.badRequest(
                `File size exceeds maximum allowed size of ${config.upload.maxFileSize / 1024 / 1024} MB`
            );
        }

        return true;
    }

    /**
     * Save a base64 data URI PDF (data:application/pdf[;params];base64,...)
     * Accepts optional `type` to prefix filename ('invoice', 'quotation', etc).
     */
    async saveBase64PDF(base64String, type = 'invoice') {
        try {
            this.validateBase64(base64String);

            // Extract raw base64 part robustly (allow optional params)
            const { base64Part } = this._extractBase64Part(base64String);
            if (!base64Part) {
                throw ApiError.badRequest('Invalid base64 PDF data');
            }

            // Validate characters (basic)
            if (!/^[A-Za-z0-9+/=\s\r\n]+$/.test(base64Part)) {
                throw ApiError.badRequest('Invalid base64 content');
            }

            // Convert base64 to buffer
            const buffer = Buffer.from(base64Part, 'base64');

            // Validate buffer is a PDF and size
            this._validateBufferIsPdf(buffer);

            // Generate unique filename
            const filename = `${type}_${uuidv4()}_${Date.now()}.pdf`;
            const filepath = path.join(this.invoicesDir, filename);

            // Save file
            await fs.promises.writeFile(filepath, buffer);

            logger.info(`File saved: ${filename}`);

            // Generate URL
            const fileUrl = `${config.baseUrl}/uploads/invoices/${filename}`;

            return {
                filename,
                filepath,
                url: fileUrl,
                size: buffer.length,
            };
        } catch (error) {
            logger.error('Error saving PDF (base64):', error);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to save PDF');
        }
    }

    /**
     * Save a raw Buffer (e.g. from multer memoryStorage: req.file.buffer)
     * originalName is optional and used for nicer generated names (not to trust it for security).
     */
    async saveBufferPDF(buffer, originalName = 'upload.pdf', type = 'invoice') {
        try {
            // Validate buffer and size
            this._validateBufferIsPdf(buffer);

            // Clean up originalName to safe chars for logging
            const safeOriginal = (originalName || 'upload.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '_');

            // Generate unique filename (preserve original extension if any)
            const ext = path.extname(safeOriginal) || '.pdf';
            const filename = `${type}_${uuidv4()}_${Date.now()}${ext}`;
            const filepath = path.join(this.invoicesDir, filename);

            // Save file
            await fs.promises.writeFile(filepath, buffer);

            logger.info(`File saved from buffer: ${filename} (original: ${safeOriginal})`);

            // Generate URL
            const fileUrl = `${config.baseUrl}/uploads/invoices/${filename}`;

            return {
                filename,
                filepath,
                url: fileUrl,
                size: buffer.length,
            };
        } catch (error) {
            logger.error('Error saving PDF (buffer):', error);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to save PDF');
        }
    }

    async deleteFile(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
                logger.info(`File deleted: ${filepath}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error deleting file:', error);
            return false;
        }
    }

    async deleteFileByUrl(url) {
        try {
            // Extract filename from URL
            const filename = url.split('/').pop();
            const filepath = path.join(this.invoicesDir, filename);
            return await this.deleteFile(filepath);
        } catch (error) {
            logger.error('Error deleting file by URL:', error);
            return false;
        }
    }

    getFileInfo(filepath) {
        try {
            const stats = fs.statSync(filepath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                exists: true,
            };
        } catch (error) {
            return {
                exists: false,
            };
        }
    }
}

module.exports = new FileUploadManager();
