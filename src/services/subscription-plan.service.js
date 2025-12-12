const database = require('../config/database');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

class SubscriptionPlanService {
    getSubscriptionPlan() {
        return database.getModels().SubscriptionPlan;
    }

    async getAllActivePlans() {
        const SubscriptionPlan = this.getSubscriptionPlan();
        try {
            return await SubscriptionPlan.findAll({
                where: { status: 'active' },
                order: [['price', 'ASC']]
            });
        } catch (error) {
            throw ApiError.internal(error.message || 'Failed to fetch subscription plans');
        }
    }

    async getPlanByUuid(uuid) {
        const SubscriptionPlan = this.getSubscriptionPlan();

        try {
            const plan = await SubscriptionPlan.findOne({
                where: { uuid, status: 'active' }
            });

            if (!plan) {
                throw (ApiError.notFound('Subscription plan not found'));
            }
            return plan;
        } catch (error) {
            throw ApiError.internal(error.message || 'Failed to fetch subscription plan');
        }

    }
}

module.exports = new SubscriptionPlanService();