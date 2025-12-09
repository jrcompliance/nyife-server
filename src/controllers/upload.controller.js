const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class UploadController {
    upload = asyncHandler(async (req, res) => {


        console.log(req.body, "  REEEEEEEEEEEEEEEEEEEEEEEEQQQQQQQQQQQQQQQQQQQQQQQ  ");
        const invoice = await uploadService.upload(req.body, req.file);
        res.status(201).json(ApiResponse.created(invoice, 'Uploaded successfully'));
    });
}

module.exports = new UploadController();