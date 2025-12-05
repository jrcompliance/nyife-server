const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const createRateLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || config.rateLimit.windowMs,
        max: options.max || config.rateLimit.max,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            throw ApiError.tooManyRequests('Too many requests, please try again later.');
        },
        ...options,
    });
};

const strictRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
});

const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
});

module.exports = {
    createRateLimiter,
    strictRateLimiter,
    authRateLimiter,
    defaultRateLimiter: createRateLimiter(),
};