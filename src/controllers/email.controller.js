const emailService = require('../services/email.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class EmailController {
    sendInvoice = asyncHandler(async (req, res) => {

        const result = await emailService.sendInvoice(req.body);

        res.json(
            ApiResponse.success(result, 'Email sent successfully')
        );
    });
}

module.exports = new EmailController();