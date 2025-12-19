const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');

// Dashboard overview
router.get('/dashboard/stats', AnalyticsController.getDashboardStats);

// Revenue trend
router.get('/revenue/trend', AnalyticsController.getRevenueTrend);

// Payment method analysis
router.get('/payment-methods', AnalyticsController.getPaymentMethodAnalysis);

// Platform charge analysis
router.get('/platform-charges', AnalyticsController.getPlatformChargeAnalysis);

// Top customers
router.get('/top-customers', AnalyticsController.getTopCustomers);

// Discount analysis
router.get('/discounts', AnalyticsController.getDiscountAnalysis);

// Filtered invoice list
router.get('/invoices', AnalyticsController.getFilteredInvoices);

module.exports = router;