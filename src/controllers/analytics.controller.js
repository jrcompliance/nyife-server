const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AnalyticsController {
    getDashboardStats = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getDashboardStats(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getRevenueTrend = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getRevenueTrend(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getPaymentMethodAnalysis = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getPaymentMethodAnalysis(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getPlatformChargeAnalysis = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getPlatformChargeAnalysis(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getTopCustomers = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getTopCustomers(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getDiscountAnalysis = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getDiscountAnalysis(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });

    getFilteredInvoices = asyncHandler(async (req, res) => {
        const invoice = await analyticsService.getFilteredInvoices(req.query);
        res.json(ApiResponse.success(invoice, 'Invoice analytics retrieved successfully'));
    });


}

module.exports = new AnalyticsController();