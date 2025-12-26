const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const database = require('../config/database');
const logger = require('../utils/logger');

class BankInfoService {
    getBankInfo() {
        return database.getModels().BankInfo;
    }

    validateIfscCode(ifscCode) {
        if (!ifscCode || typeof ifscCode !== 'string') {
            throw ApiError.badRequest('IFSC code is required');
        }

        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        const cleanIfsc = ifscCode.toUpperCase().trim();

        if (cleanIfsc.length !== 11) {
            throw ApiError.badRequest('IFSC code must be exactly 11 characters');
        }

        if (!ifscRegex.test(cleanIfsc)) {
            throw ApiError.badRequest('Invalid IFSC code format');
        }

        return cleanIfsc;
    }

    validateAccountNumber(accountNumber) {
        if (!accountNumber || typeof accountNumber !== 'string') {
            throw ApiError.badRequest('Account number is required');
        }

        const cleanAccount = accountNumber.trim();

        if (!/^\d+$/.test(cleanAccount)) {
            throw ApiError.badRequest('Account number must contain only digits');
        }

        if (cleanAccount.length < 9 || cleanAccount.length > 20) {
            throw ApiError.badRequest('Account number must be between 9 and 20 digits');
        }

        return cleanAccount;
    }

    async handlePrimaryBankInfo(isPrimary, excludeId = null) {
        if (isPrimary) {
            const BankInfo = this.getBankInfo();
            const whereClause = { is_primary: true };

            if (excludeId) {
                whereClause.id = { [Op.ne]: excludeId };
            }

            await BankInfo.update(
                { is_primary: false },
                { where: whereClause }
            );

            logger.info('Unset other primary bank accounts');
        }
    }

    async createBankInfo(data) {
        try {
            const BankInfo = this.getBankInfo();

            // Validate IFSC code
            const validIfsc = this.validateIfscCode(data.ifsc_code);

            // Validate account number
            const validAccount = this.validateAccountNumber(data.account_number);

            // Handle primary bank info
            await this.handlePrimaryBankInfo(data.is_primary);

            const bankInfo = await BankInfo.create({
                account_name: data.account_name.trim(),
                bank_name: data.bank_name.trim(),
                account_number: validAccount,
                branch: data.branch.trim(),
                ifsc_code: validIfsc,
                account_type: data.account_type || 'savings',
                is_primary: data.is_primary || false,
                status: data.status || 'active',
            });

            logger.info(`Bank info created: ${bankInfo.id}`);
            return bankInfo;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error('Error creating bank info:', error);
            throw ApiError.internal(error?.message || 'Failed to create bank info');
        }
    }

    async getAllBankInfo(filters = {}) {
        try {
            const BankInfo = this.getBankInfo();
            const { page = 1, limit = 10, status, is_primary, search } = filters;

            const offset = (page - 1) * limit;
            const where = {};

            if (status) {
                where.status = status;
            }

            if (is_primary !== undefined) {
                where.is_primary = is_primary;
            }

            if (search) {
                where[Op.or] = [
                    { account_name: { [Op.like]: `%${search}%` } },
                    { bank_name: { [Op.like]: `%${search}%` } },
                    { account_number: { [Op.like]: `%${search}%` } },
                    { ifsc_code: { [Op.like]: `%${search}%` } },
                    { branch: { [Op.like]: `%${search}%` } },
                ];
            }

            const { count, rows } = await BankInfo.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_at', 'DESC']],
            });

            logger.info(`Retrieved ${rows.length} bank info records`);

            return {
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit),
                },
            };

        } catch (error) {
            logger.error('Error fetching bank info:', error);
            throw ApiError.internal(error?.message || 'Failed to fetch bank info');
        }
    }

    async getBankInfoById(id) {
        try {
            const BankInfo = this.getBankInfo();

            const bankInfo = await BankInfo.findByPk(id);

            if (!bankInfo) {
                throw ApiError.notFound('Bank info not found');
            }

            logger.info(`Retrieved bank info: ${id}`);
            return bankInfo;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error('Error fetching bank info by ID:', error);
            throw ApiError.internal(error?.message || 'Failed to fetch bank info');
        }
    }

    async updateBankInfo(id, data) {
        try {
            const BankInfo = this.getBankInfo();

            const bankInfo = await BankInfo.findByPk(id);

            if (!bankInfo) {
                throw ApiError.notFound('Bank info not found');
            }

            // Validate IFSC code if provided
            if (data.ifsc_code) {
                data.ifsc_code = this.validateIfscCode(data.ifsc_code);
            }

            // Validate account number if provided
            if (data.account_number) {
                data.account_number = this.validateAccountNumber(data.account_number);
            }

            // Handle primary bank info
            if (data.is_primary !== undefined && data.is_primary && !bankInfo.is_primary) {
                await this.handlePrimaryBankInfo(true, id);
            }

            // Clean string fields
            const updateData = {};
            if (data.account_name) updateData.account_name = data.account_name.trim();
            if (data.bank_name) updateData.bank_name = data.bank_name.trim();
            if (data.branch) updateData.branch = data.branch.trim();
            if (data.account_number) updateData.account_number = data.account_number;
            if (data.ifsc_code) updateData.ifsc_code = data.ifsc_code;
            if (data.account_type) updateData.account_type = data.account_type;
            if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
            if (data.status) updateData.status = data.status;

            await bankInfo.update(updateData);

            logger.info(`Bank info updated: ${id}`);
            return bankInfo;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error('Error updating bank info:', error);
            throw ApiError.internal(error?.message || 'Failed to update bank info');
        }
    }

    async deleteBankInfo(id) {
        try {
            const BankInfo = this.getBankInfo();

            const bankInfo = await BankInfo.findByPk(id);

            if (!bankInfo) {
                throw ApiError.notFound('Bank info not found');
            }

            await bankInfo.destroy();

            logger.info(`Bank info deleted: ${id}`);
            return true;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error('Error deleting bank info:', error);
            throw ApiError.internal(error?.message || 'Failed to delete bank info');
        }
    }

    async getPrimaryBankInfo() {
        try {
            const BankInfo = this.getBankInfo();

            const bankInfo = await BankInfo.findOne({
                where: {
                    is_primary: true,
                    status: 'active',
                },
            });

            if (!bankInfo) {
                throw ApiError.notFound('No primary bank account found');
            }

            logger.info(`Retrieved primary bank info: ${bankInfo.id}`);
            return bankInfo;

        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            logger.error('Error fetching primary bank info:', error);
            throw ApiError.internal(error?.message || 'Failed to fetch primary bank info');
        }
    }
}

module.exports = new BankInfoService();