const gstService = require('../services/gst_info.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class GstController {
    verifyGst = asyncHandler(async (req, res) => {
        const { gst_number } = req.body;
        const result = await gstService.verifyGst(gst_number);
        res.json(ApiResponse.success(result, 'GST verified successfully'));
    });

    isGstExists = asyncHandler(async (req, res) => {
        const { gst_number } = req.body;
        const result = await gstService.isGstExists(gst_number);
        res.json(ApiResponse.success(result, 'GST status retrieved'));
    });
}

module.exports = new GstController();