const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body } = require('express-validator');
const uploadController = require('../controllers/upload.controller');
const validate = require('../middleware/validation.middleware');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const logger = require('../utils/logger');


const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only PDF files are allowed'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 1,
    },
    fileFilter: fileFilter,
});

// Validation middleware
const uploadValidation = [
    body('id').notEmpty().withMessage('Invoice ID is required').isInt().withMessage('Invoice ID must be a number'),
    body('pdf_type').isIn(['quotation', 'proforma', 'payment']).withMessage('Invalid PDF type'),
    validate,
];

// Upload endpoint
router.post(
    '/',
    upload.single('pdf_data'),
    // uploadValidation,
    uploadController.upload
);

// Download PDF file
router.get('/invoices/:filename', (req, res, next) => {
    try {
        const { filename } = req.params;

        // Sanitize filename to prevent path traversal
        const sanitizedFilename = path.basename(filename);

        // Check if filename ends with .pdf
        if (!sanitizedFilename.endsWith('.pdf')) {
            throw ApiError.badRequest('Invalid file type');
        }

        const filepath = path.join(process.cwd(), config.upload.dir, 'invoices', sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            throw ApiError.notFound('File not found');
        }

        // Get file stats
        const stats = fs.statSync(filepath);

        // Log download
        logger.info(`File download: ${sanitizedFilename} (${stats.size} bytes)`);

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache

        // Stream file
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            logger.error('File stream error:', error);
            next(ApiError.internal('Error reading file'));
        });

    } catch (error) {
        next(error);
    }
});

// Force download (attachment instead of inline)
router.get('/invoices/:filename/download', (req, res, next) => {
    try {
        const { filename } = req.params;
        const sanitizedFilename = path.basename(filename);

        if (!sanitizedFilename.endsWith('.pdf')) {
            throw ApiError.badRequest('Invalid file type');
        }

        const filepath = path.join(process.cwd(), config.upload.dir, 'invoices', sanitizedFilename);

        if (!fs.existsSync(filepath)) {
            throw ApiError.notFound('File not found');
        }

        logger.info(`File download (attachment): ${sanitizedFilename}`);

        // Force download with attachment disposition
        res.download(filepath, sanitizedFilename, (err) => {
            if (err) {
                logger.error('Download error:', err);
                next(ApiError.internal('Error downloading file'));
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;