const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config/env');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');
const { successHandler, errorHandler: logErrorHandler } = require('./middleware/logger.middleware');
const { defaultRateLimiter } = require('./middleware/rateLimit.middleware');
const ApiError = require('./utils/ApiError');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.env !== 'test') {
    app.use(successHandler);
    app.use(logErrorHandler);
}

// Rate limiting
app.use(defaultRateLimiter);

// Trust proxy
app.set('trust proxy', 1);

// API routes
app.use(config.apiVersion, routes);

// 404 handler
app.use((req, res, next) => {
    next(ApiError.notFound('Route not found'));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;

