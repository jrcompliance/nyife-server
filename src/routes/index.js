const express = require('express');
const invoiceRoutes = require('./invoice.routes');
const uploadRoutes = require('./upload.routes');
const emailRoutes = require('./email.routes');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/invoices',
        route: invoiceRoutes,
    },
    {
        path: '/uploads',
        route: uploadRoutes,
    },
    {
        path: '/email',
        route: emailRoutes,
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

router.get('/health', (_, res) => {
    res.json({ status: 'OK', message: "Server healthy", timestamp: new Date().toISOString() });
});

module.exports = router;