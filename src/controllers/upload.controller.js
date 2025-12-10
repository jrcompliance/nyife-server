const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

class UploadController {
    upload = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw ApiError.badRequest('PDF file is required');
        }

        const result = await uploadService.upload(req.body, req.file);

        res.status(200).json(
            ApiResponse.success(result, 'PDF uploaded and invoice updated successfully')
        );
    });
}

module.exports = new UploadController();