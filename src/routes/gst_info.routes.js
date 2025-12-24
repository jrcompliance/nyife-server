const express = require('express');
const { body } = require('express-validator');
const gstController = require('../controllers/gst_info.controller');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

const gstValidation = [
    body('gst_number')
        .trim()
        .notEmpty().withMessage('GST number is required')
        .isLength({ min: 15, max: 15 }).withMessage('GST number must be 15 characters')
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Invalid GST number format'),
    validate,
];

router.post('/verify', gstValidation, gstController.verifyGst);
router.post('/is-exists', gstValidation, gstController.isGstExists);

module.exports = router;