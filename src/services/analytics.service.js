const { Op, fn, col, literal } = require('sequelize');
const database = require('../config/database');
const ApiError = require('../utils/ApiError');

class AnalyticsService {
    getInvoice() {
        return database.getModels().Invoice;
    }

    // Get dashboard overview statistics
    async getDashboardStats(query) {
        const Invoice = this.getInvoice();
        try {
            const { startDate, endDate, paymentStatus, platformChargeType, createdBy } = query;

            // Build where clause for filters
            const whereClause = {};
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
            if (paymentStatus) {
                whereClause.payment_status = paymentStatus;
            }
            if (platformChargeType) {
                whereClause.platform_charge_type = platformChargeType;
            }

            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            // Total Revenue
            const revenueData = await Invoice.findOne({
                attributes: [
                    [fn('SUM', col('total')), 'totalRevenue'],
                    // [fn('SUM', col('platform_charge')), 'platformRevenue'],
                    [fn('SUM', col('wallet_recharge')), 'walletRevenue'],
                    [fn('SUM', col('discount_amount')), 'totalDiscount'],
                    [fn('SUM', col('GST_amount')), 'totalGST']
                ],
                where: whereClause,
                raw: true
            });

            // Payment Status Breakdown
            const paymentStatusCount = await Invoice.findAll({
                attributes: [
                    'payment_status',
                    [fn('COUNT', col('id')), 'count'],
                    [fn('SUM', col('total')), 'amount']
                ],
                where: whereClause,
                group: ['payment_status'],
                raw: true
            });

            // Total Invoices
            const totalInvoices = await Invoice.count({ where: whereClause });

            // Paid vs Unpaid
            const paidInvoices = paymentStatusCount.find(s => s.payment_status === 'paid') || { count: 0, amount: 0 };
            const unpaidInvoices = paymentStatusCount.find(s => s.payment_status === 'unpaid') || { count: 0, amount: 0 };

            return {
                totalRevenue: parseFloat(revenueData.totalRevenue || 0),
                // platformRevenue: parseFloat(revenueData.platformRevenue || 0),
                walletRevenue: parseFloat(revenueData.walletRevenue || 0),
                totalGST: parseFloat(revenueData.totalGST || 0),
                totalDiscount: parseFloat(revenueData.totalDiscount || 0),
                totalInvoices,
                paidInvoices: {
                    count: parseInt(paidInvoices.count),
                    amount: parseFloat(paidInvoices.amount || 0)
                },
                unpaidInvoices: {
                    count: parseInt(unpaidInvoices.count),
                    amount: parseFloat(unpaidInvoices.amount || 0)
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw ApiError.internal(error.message || 'Failed to get dashboard stats');
        }
    }

    // Revenue trend over time (daily/weekly/monthly)
    async getRevenueTrend(query) {
        const Invoice = this.getInvoice();
        try {
            const { groupBy = 'day', startDate, endDate, createdBy } = query;

            const whereClause = {};
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            let dateFormat;
            switch (groupBy) {
                case 'month':
                    dateFormat = '%Y-%m';
                    break;
                case 'week':
                    dateFormat = '%Y-%U';
                    break;
                case 'day':
                default:
                    dateFormat = '%Y-%m-%d';
                    break;
            }

            const revenueTrend = await Invoice.findAll({
                attributes: [
                    [fn('DATE_FORMAT', col('created_at'), dateFormat), 'period'],
                    [fn('SUM', col('total')), 'revenue'],
                    [fn('SUM', col('platform_charge')), 'platformCharge'],
                    [fn('SUM', col('wallet_recharge')), 'walletRecharge'],
                    [fn('COUNT', col('id')), 'invoiceCount']
                ],
                where: whereClause,
                group: [literal('period')],
                order: [[literal('period'), 'ASC']],
                raw: true
            });

            return revenueTrend.map(item => ({
                period: item.period,
                revenue: parseFloat(item.revenue || 0),
                platformCharge: parseFloat(item.platformCharge || 0),
                walletRecharge: parseFloat(item.walletRecharge || 0),
                invoiceCount: parseInt(item.invoiceCount)
            }))
        } catch (error) {
            console.error('Error fetching revenue trend:', error);
            throw ApiError.internal(error.message || 'Failed to get revenue trend');
        }
    }

    // Payment method analysis
    async getPaymentMethodAnalysis(query) {
        const Invoice = this.getInvoice();
        try {
            const { startDate, endDate, createdBy } = query;

            const whereClause = { payment_status: 'paid' };
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            const paymentMethods = await Invoice.findAll({
                attributes: [
                    'payment_method',
                    [fn('COUNT', col('id')), 'count'],
                    [fn('SUM', col('total')), 'totalAmount']
                ],
                where: whereClause,
                group: ['payment_method'],
                raw: true
            });

            return paymentMethods.map(method => ({
                method: method.payment_method || 'Unknown',
                count: parseInt(method.count),
                totalAmount: parseFloat(method.totalAmount || 0)
            }))
        } catch (error) {
            console.error('Error fetching payment method analysis:', error);
            throw ApiError.internal(error.message || 'Failed to get payment method analysis');
        }
    }

    // Platform charge type analysis
    async getPlatformChargeAnalysis(query) {
        const Invoice = this.getInvoice();
        try {
            const { startDate, endDate, createdBy } = query;

            const whereClause = {};
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            const chargeTypes = await Invoice.findAll({
                attributes: [
                    'platform_charge_type',
                    [fn('COUNT', col('id')), 'count'],
                    [fn('SUM', col('platform_charge')), 'totalCharge'],
                    [fn('AVG', col('platform_charge')), 'avgCharge']
                ],
                where: whereClause,
                group: ['platform_charge_type'],
                raw: true
            });

            return chargeTypes.map(type => ({
                type: type.platform_charge_type || 'Not Set',
                count: parseInt(type.count),
                totalCharge: parseFloat(type.totalCharge || 0),
                avgCharge: parseFloat(type.avgCharge || 0)
            })).filter(i => i.type !== 'Not Set');
        } catch (error) {
            console.error('Error fetching platform charge analysis:', error);
            throw ApiError.internal(error.message || 'Failed to get platform charge analysis');
        }
    }

    // Top customers by revenue
    async getTopCustomers(query) {
        const Invoice = this.getInvoice();
        try {
            const { limit = 10, startDate, endDate, createdBy } = query;

            const whereClause = {};
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            const topCustomers = await Invoice.findAll({
                attributes: [
                    'company_name',
                    'contact_person',
                    'email',
                    [fn('COUNT', col('id')), 'invoiceCount'],
                    [fn('SUM', col('total')), 'totalRevenue'],
                    [fn('AVG', col('total')), 'avgInvoiceValue']
                ],
                where: whereClause,
                group: ['company_name', 'contact_person', 'email'],
                order: [[fn('SUM', col('total')), 'DESC']],
                limit: parseInt(limit),
                raw: true
            });

            return topCustomers.map(customer => ({
                companyName: customer.company_name,
                contactPerson: customer.contact_person,
                email: customer.email,
                invoiceCount: parseInt(customer.invoiceCount),
                totalRevenue: parseFloat(customer.totalRevenue || 0),
                avgInvoiceValue: parseFloat(customer.avgInvoiceValue || 0)
            }))
        } catch (error) {
            console.error('Error fetching top customers:', error);
            throw ApiError.internal(error.message || 'Failed to get top customers');
        }
    }

    // Discount analysis
    async getDiscountAnalysis(query) {
        const Invoice = this.getInvoice();
        try {
            const { startDate, endDate, createdBy } = query;

            const whereClause = {
                discount: { [Op.gt]: 0 }
            };
            if (startDate && endDate) {
                whereClause.created_at = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
            if (createdBy) {
                whereClause[Op.and] = [literal(`JSON_EXTRACT(created_by, '$.id') = ${createdBy}`)];
            }

            const discountStats = await Invoice.findOne({
                attributes: [
                    [fn('COUNT', col('id')), 'totalDiscountedInvoices'],
                    [fn('SUM', col('discount_amount')), 'totalDiscountGiven'],
                    [fn('AVG', col('discount')), 'avgDiscountPercent'],
                    [fn('SUM', col('sub_total')), 'totalSubTotal']
                ],
                where: whereClause,
                raw: true
            });

            const totalInvoices = await Invoice.count({
                where: startDate && endDate ? { created_at: whereClause.created_at } : {}
            });

            return {
                totalDiscountedInvoices: parseInt(discountStats.totalDiscountedInvoices || 0),
                totalDiscountGiven: parseFloat(discountStats.totalDiscountGiven || 0),
                avgDiscountPercent: parseFloat(discountStats.avgDiscountPercent || 0),
                discountRate: ((discountStats.totalDiscountedInvoices / totalInvoices) * 100).toFixed(2)
            }

        } catch (error) {
            console.error('Error fetching discount analysis:', error);
            throw ApiError.internal(error.message || 'Failed to get discount analysis');
        }
    }
};

module.exports = new AnalyticsService();


// // Invoice list with filters
// async getFilteredInvoices(query) {
//     const Invoice = this.getInvoice();
//     try {
//         const {
//             page = 1,
//             limit = 10,
//             paymentStatus,
//             platformChargeType,
//             startDate,
//             endDate,
//             search
//         } = query;

//         const whereClause = {};

//         if (paymentStatus) {
//             whereClause.payment_status = paymentStatus;
//         }
//         if (platformChargeType) {
//             whereClause.platform_charge_type = platformChargeType;
//         }
//         if (startDate && endDate) {
//             whereClause.created_at = {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             };
//         }
//         if (search) {
//             whereClause[Op.or] = [
//                 { company_name: { [Op.like]: `%${search}%` } },
//                 { contact_person: { [Op.like]: `%${search}%` } },
//                 { email: { [Op.like]: `%${search}%` } },
//                 { quotation_number: { [Op.like]: `%${search}%` } }
//             ];
//         }

//         const offset = (parseInt(page) - 1) * parseInt(limit);

//         const { count, rows } = await Invoice.findAndCountAll({
//             where: whereClause,
//             limit: parseInt(limit),
//             offset,
//             order: [['created_at', 'DESC']]
//         });

//         return {
//             invoices: rows,
//             pagination: {
//                 total: count,
//                 page: parseInt(page),
//                 limit: parseInt(limit),
//                 totalPages: Math.ceil(count / parseInt(limit))
//             }
//         }
//     } catch (error) {
//         console.error('Error fetching filtered invoices:', error);
//         throw ApiError.internal(error.message || 'Failed to get filtered invoices');
//     }
// }