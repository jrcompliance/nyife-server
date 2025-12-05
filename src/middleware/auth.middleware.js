const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        throw ApiError.unauthorized('No token provided');
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        throw ApiError.unauthorized('Invalid or expired token');
    }
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw ApiError.unauthorized('User not authenticated');
        }

        if (!roles.includes(req.user.role)) {
            throw ApiError.forbidden('Insufficient permissions');
        }

        next();
    };
};

module.exports = { authenticate, authorize };