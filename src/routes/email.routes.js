const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validation.middleware');
const emailController = require('../controllers/email.controller');

const router = express.Router();

const invoiceValidation = [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('invoice_type').trim().notEmpty().withMessage('Invoice type is required'),
    body('invoice_number').trim().notEmpty().withMessage('Invoice number is required'),
    body('invoice_url').trim().notEmpty().withMessage('Invoice URL is required'),
    body('email').isEmail().normalizeEmail().withMessage('Email is required'),
    validate,
];

router.post('/share-invoice', invoiceValidation, emailController.sendInvoice);

module.exports = router;