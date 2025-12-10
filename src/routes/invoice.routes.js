const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoice.controller');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

const invoiceValidation = [
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('contact_person').trim().notEmpty().withMessage('Contact person is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    validate,
];

router.post('/', invoiceValidation, invoiceController.createInvoice);
router.put('/generate-proforma/:id', invoiceController.generateProformaInvoice);
router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;