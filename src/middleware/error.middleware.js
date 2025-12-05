const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

const errorConverter = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    next(error);
};

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    if (config.env === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    res.locals.errorMessage = message;

    const response = {
        statusCode,
        success: false,
        message,
        timestamp: new Date().toISOString(),
        ...(config.env === 'development' && { stack: err.stack }),
        ...(config.env === 'development' && { path: req.path }),
    };

    if (config.env === 'development') {
        logger.error(err);
    } else {
        logger.error(message, {
            statusCode,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
    }

    res.status(statusCode).json(response);
};

module.exports = { errorConverter, errorHandler };