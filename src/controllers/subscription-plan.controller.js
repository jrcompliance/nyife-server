
const subscriptionPlanService = require('../services/subscription-plan.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

class SubscriptionPlanController {
    getPlans = asyncHandler(async (req, res) => {
        const plans = await subscriptionPlanService.getAllActivePlans();
        res.json(ApiResponse.success(plans, 'Plans fetched successfully'));

    });

    async getPlanByUuid(req, res) {
        const { uuid } = req.params;
        const plan = await subscriptionPlanService.getPlanByUuid(uuid);
        res.json(ApiResponse.success(plan, 'Plans fetched successfully'));

    }
}

module.exports = new SubscriptionPlanController();