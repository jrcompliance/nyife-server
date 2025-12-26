const bankInfoService = require('../services/bank_info.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class BankInfoController {
    create = asyncHandler(async (req, res) => {
        const result = await bankInfoService.createBankInfo(req.body);
        res.status(201).json(ApiResponse.success(result, 'Bank info created successfully'));
    });

    getAll = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, status, is_primary, search } = req.query;
        const result = await bankInfoService.getAllBankInfo({
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            is_primary: is_primary === 'true' ? true : is_primary === 'false' ? false : undefined,
            search,
        });
        res.json(ApiResponse.success(result, 'Bank info retrieved successfully'));
    });

    getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await bankInfoService.getBankInfoById(id);
        res.json(ApiResponse.success(result, 'Bank info retrieved successfully'));
    });

    update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await bankInfoService.updateBankInfo(id, req.body);
        res.json(ApiResponse.success(result, 'Bank info updated successfully'));
    });

    delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await bankInfoService.deleteBankInfo(id);
        res.json(ApiResponse.success(null, 'Bank info deleted successfully'));
    });

    getPrimary = asyncHandler(async (req, res) => {
        const result = await bankInfoService.getPrimaryBankInfo();
        res.json(ApiResponse.success(result, 'Primary bank info retrieved successfully'));
    });
}

module.exports = new BankInfoController();