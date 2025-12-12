const express = require('express');
const router = express.Router();
const subscriptionPlanController = require('../controllers/subscription-plan.controller');

// Get all active subscription plans
router.get('/', subscriptionPlanController.getPlans);

// Get plan by UUID
router.get('/:uuid', subscriptionPlanController.getPlanByUuid);


module.exports = router;