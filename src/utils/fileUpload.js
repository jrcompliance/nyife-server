const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('./logger');
const ApiError = require('./ApiError');

class FileUploadManager {
    constructor() {
        this.uploadDir = path.join(process.cwd(), config.upload.dir);
        this.invoicesDir = path.join(this.uploadDir, 'invoices');
        this.allowedMimeTypes = ['application/pdf'];
        this.maxFileSize = config.upload.maxFileSize;
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.uploadDir, this.invoicesDir].forEach(dir => {
            if (!fsSync.existsSync(dir)) {
                fsSync.mkdirSync(dir, { recursive: true, mode: 0o755 });
                logger.info(`Created directory: ${dir}`);
            }
        });
    }

    /**
     * Validate file buffer
     * @param {Buffer} buffer - File buffer
     * @returns {boolean}
     */
    validatePDFBuffer(buffer) {
        if (!buffer || !Buffer.isBuffer(buffer)) {
            throw ApiError.badRequest('Invalid file buffer');
        }

        // Check PDF magic number (file signature)
        const pdfSignature = buffer.toString('utf8', 0, 5);
        if (pdfSignature !== '%PDF-') {
            throw ApiError.badRequest('File is not a valid PDF');
        }

        // Check file size
        if (buffer.length > this.maxFileSize) {
            const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(2);
            throw ApiError.badRequest(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
        }

        // Check minimum file size (100 bytes)
        if (buffer.length < 100) {
            throw ApiError.badRequest('File is too small to be a valid PDF');
        }

        return true;
    }

    /**
     * Sanitize filename
     * @param {string} filename - Original filename
     * @returns {string} - Sanitized filename
     */
    sanitizeFilename(filename) {
        if (!filename) return '';

        // Remove path traversal attempts
        filename = path.basename(filename);

        // Remove or replace dangerous characters
        filename = filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 200); // Limit length

        return filename;
    }

    /**
     * Generate unique filename with sanitization
     * @param {string} originalName - Original filename
     * @returns {string} - Unique filename
     */
    generateFilename(originalName = '') {
        const sanitized = this.sanitizeFilename(originalName);
        const baseName = sanitized.replace(/\.pdf$/i, '') || 'document';
        return `${baseName}.pdf`;
    }

    /**
     * Save PDF from buffer (for Multer uploads)
     * @param {Buffer} buffer - File buffer
     * @param {string} originalName - Original filename
     * @returns {Object} - File info
     */
    async savePDF(buffer, originalName = 'document.pdf') {
        let filepath = null;

        try {
            // Validate buffer
            this.validatePDFBuffer(buffer);

            // Generate unique filename
            const filename = this.generateFilename(originalName);
            filepath = path.join(this.invoicesDir, filename);

            // Save file atomically (write to temp first, then rename)
            const tempPath = `${filepath}.tmp`;
            await fs.writeFile(tempPath, buffer, { mode: 0o644 });
            await fs.rename(tempPath, filepath);

            logger.info(`PDF saved successfully: ${filename} (${buffer.length} bytes)`);

            // Generate public URL
            const fileUrl = `${config.baseUrl}${config.apiVersion}/uploads/invoices/${filename}`;

            return {
                filename,
                filepath,
                url: fileUrl,
                size: buffer.length,
                mimeType: 'application/pdf',
                uploadedAt: new Date().toISOString(),
            };

        } catch (error) {
            // Cleanup on error
            if (filepath && fsSync.existsSync(filepath)) {
                try {
                    await fs.unlink(filepath);
                } catch (cleanupErr) {
                    logger.error('Cleanup failed:', cleanupErr);
                }
            }

            logger.error('Error saving PDF:', error);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to save PDF file');
        }
    }

    /**
     * Save PDF from base64 string
     * @param {string} base64String - Base64 encoded PDF
     * @param {string} filename - Filename
     * @returns {Object} - File info
     */
    async saveBase64PDF(base64String, filename = 'document.pdf') {
        try {
            if (!base64String || typeof base64String !== 'string') {
                throw ApiError.badRequest('Invalid base64 string');
            }

            // Extract base64 data (handle with/without data URI prefix)
            let base64Data = base64String;
            if (base64String.startsWith('data:')) {
                const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    throw ApiError.badRequest('Invalid base64 format');
                }
                base64Data = matches[2];
            }

            // Convert to buffer
            const buffer = Buffer.from(base64Data, 'base64');

            // Use existing savePDF method
            return await this.savePDF(buffer, filename);

        } catch (error) {
            logger.error('Error saving base64 PDF:', error);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to save base64 PDF');
        }
    }

    /**
     * Delete file by filename
     * @param {string} filename - Filename to delete
     * @returns {boolean} - Success status
     */
    async deletePDF(filename) {
        try {
            if (!filename) {
                throw ApiError.badRequest('Filename is required');
            }

            // Sanitize filename to prevent path traversal
            const sanitizedFilename = path.basename(filename);
            const filepath = path.join(this.invoicesDir, sanitizedFilename);

            // Check if file exists
            if (!fsSync.existsSync(filepath)) {
                logger.warn(`File not found for deletion: ${filename}`);
                return false;
            }

            // Delete file
            await fs.unlink(filepath);
            logger.info(`PDF deleted successfully: ${filename}`);

            return true;

        } catch (error) {
            logger.error('Error deleting PDF:', error);
            return false;
        }
    }

    /**
     * Delete file by URL
     * @param {string} url - File URL
     * @returns {boolean} - Success status
     */
    async deleteByUrl(url) {
        try {
            if (!url) return false;

            // Extract filename from URL
            const filename = url.split('/').pop();
            return await this.deletePDF(filename);

        } catch (error) {
            logger.error('Error deleting file by URL:', error);
            return false;
        }
    }

    /**
     * Get file information
     * @param {string} filename - Filename
     * @returns {Object} - File info
     */
    async getFileInfo(filename) {
        try {
            const filepath = path.join(this.invoicesDir, path.basename(filename));

            if (!fsSync.existsSync(filepath)) {
                return { exists: false };
            }

            const stats = await fs.stat(filepath);

            return {
                exists: true,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isFile: stats.isFile(),
                path: filepath,
            };

        } catch (error) {
            logger.error('Error getting file info:', error);
            return { exists: false };
        }
    }

    /**
     * Check if file exists
     * @param {string} filename - Filename
     * @returns {boolean}
     */
    async fileExists(filename) {
        try {
            const filepath = path.join(this.invoicesDir, path.basename(filename));
            return fsSync.existsSync(filepath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Clean up old files (older than specified days)
     * @param {number} days - Number of days
     * @returns {number} - Number of files deleted
     */
    async cleanupOldFiles(days = 30) {
        try {
            const files = await fs.readdir(this.invoicesDir);
            const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
            let deletedCount = 0;

            for (const file of files) {
                const filepath = path.join(this.invoicesDir, file);
                const stats = await fs.stat(filepath);

                if (stats.mtime.getTime() < cutoffDate) {
                    await fs.unlink(filepath);
                    deletedCount++;
                    logger.info(`Cleaned up old file: ${file}`);
                }
            }

            logger.info(`Cleanup completed: ${deletedCount} files deleted`);
            return deletedCount;

        } catch (error) {
            logger.error('Error during cleanup:', error);
            return 0;
        }
    }
}

module.exports = new FileUploadManager();