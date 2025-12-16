require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        name: process.env.DB_NAME || 'appdb',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
            min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
        }
    },
    // redis: {
    //     url: process.env.REDIS_URL || 'redis://localhost:6379',
    //     maxRetriesPerRequest: 3,
    // },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        expire: process.env.JWT_EXPIRE || '7d',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
    log: {
        level: process.env.LOG_LEVEL || 'info',
    },
    upload: {
        dir: process.env.UPLOAD_DIR || 'uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    },
    smtp: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10) || 465,
        secure: parseInt(process.env.MAIL_PORT, 10) === 465,
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        fromName: process.env.MAIL_FROM_NAME,
        from: process.env.MAIL_FROM_ADDRESS,
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    baseUrl: process.env.BASE_URL,
    apiVersion: process.env.API_VERSION || '/api/v1',

};

module.exports = config;