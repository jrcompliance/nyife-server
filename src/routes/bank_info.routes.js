const express = require('express');
const { body, param, query } = require('express-validator');
const bankInfoController = require('../controllers/bank_info.controller');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

const createBankValidation = [
    body('account_name')
        .trim()
        .notEmpty().withMessage('Account name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Account name must be between 2 and 100 characters'),
    body('bank_name')
        .trim()
        .notEmpty().withMessage('Bank name is required')
        .isLength({ max: 100 }).withMessage('Bank name must not exceed 100 characters'),
    body('account_number')
        .trim()
        .notEmpty().withMessage('Account number is required')
        .isNumeric().withMessage('Account number must contain only digits')
        .isLength({ min: 9, max: 20 }).withMessage('Account number must be between 9 and 20 digits'),
    body('branch')
        .trim()
        .notEmpty().withMessage('Branch is required')
        .isLength({ max: 100 }).withMessage('Branch must not exceed 100 characters'),
    body('ifsc_code')
        .trim()
        .notEmpty().withMessage('IFSC code is required')
        .isLength({ min: 11, max: 11 }).withMessage('IFSC code must be exactly 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    body('account_type')
        .optional()
        .isIn(['savings', 'current', 'salary', 'other']).withMessage('Invalid account type'),
    body('is_primary')
        .optional()
        .isBoolean().withMessage('is_primary must be a boolean'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'closed']).withMessage('Invalid status'),
    validate,
];

const updateBankValidation = [
    param('id')
        .isUUID().withMessage('Invalid bank info ID'),
    body('account_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Account name must be between 2 and 100 characters'),
    body('bank_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Bank name must not exceed 100 characters'),
    body('account_number')
        .optional()
        .trim()
        .isNumeric().withMessage('Account number must contain only digits')
        .isLength({ min: 9, max: 20 }).withMessage('Account number must be between 9 and 20 digits'),
    body('branch')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Branch must not exceed 100 characters'),
    body('ifsc_code')
        .optional()
        .trim()
        .isLength({ min: 11, max: 11 }).withMessage('IFSC code must be exactly 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    body('account_type')
        .optional()
        .isIn(['savings', 'current', 'salary', 'other']).withMessage('Invalid account type'),
    body('is_primary')
        .optional()
        .isBoolean().withMessage('is_primary must be a boolean'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'closed']).withMessage('Invalid status'),
    validate,
];

const idValidation = [
    param('id')
        .isUUID().withMessage('Invalid bank info ID'),
    validate,
];

const listValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['active', 'inactive', 'closed']).withMessage('Invalid status'),
    query('is_primary')
        .optional()
        .isBoolean().withMessage('is_primary must be a boolean'),
    query('search')
        .optional()
        .trim(),
    validate,
];

// Routes
router.post('/', createBankValidation, bankInfoController.create);
router.get('/', listValidation, bankInfoController.getAll);
router.get('/primary', bankInfoController.getPrimary);
router.get('/:id', idValidation, bankInfoController.getById);
router.put('/:id', updateBankValidation, bankInfoController.update);
router.delete('/:id', idValidation, bankInfoController.delete);

module.exports = router;