const express = require('express');
const invoiceRoutes = require('./invoice.routes');
const gstRoutes = require('./gst_info.routes');
const analyticsRoutes = require('./analytics.routes');
const uploadRoutes = require('./upload.routes');
const emailRoutes = require('./email.routes');
const subscriptionPlanRoutes = require('./subscription-plan.routes');
const webhookRoutes = require('./webhook.routes');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/invoices',
        route: invoiceRoutes,
    },
    {
        path: '/gst',
        route: gstRoutes,
    },
    {
        path: '/analytics',
        route: analyticsRoutes,
    },
    {
        path: '/webhooks',
        route: webhookRoutes,
    },
    {
        path: '/uploads',
        route: uploadRoutes,
    },
    {
        path: '/email',
        route: emailRoutes,
    },
    {
        path: "/subscription-plans",
        route: subscriptionPlanRoutes,
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

router.get('/health', (_, res) => {
    res.json({ status: 'OK', message: "Server healthy", timestamp: new Date().toISOString() });
});

module.exports = router;