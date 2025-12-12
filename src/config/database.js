// i am want to access subscription_plans table from mysql db which is already created using another microservice backend and i want to use sequelize to do that so how i can use it in my project.

const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.sequelize = null;
        this.models = {};
    }

    async connect() {
        try {
            this.sequelize = new Sequelize(
                config.database.name,
                config.database.user,
                config.database.password,
                {
                    host: config.database.host,
                    port: config.database.port,
                    dialect: 'mysql',
                    logging: (msg) => logger.debug(msg),
                    pool: {
                        max: config.database.pool.max,
                        min: config.database.pool.min,
                        acquire: config.database.pool.acquire,
                        idle: config.database.pool.idle,
                    },
                    define: {
                        timestamps: true,
                        underscored: true,
                        freezeTableName: true,
                    },
                    dialectOptions: {
                        charset: 'utf8mb4',
                        connectTimeout: 60000,
                    },
                }
            );

            await this.sequelize.authenticate();

            logger.info('MySQL connected successfully', {
                host: config.database.host,
                database: config.database.name,
            });

            // Initialize models
            this.initializeModels();

            // Sync database (use with caution in production)

            if (config.env === 'development') {
                // await this.sequelize.sync({ alter: true });
                await this.sequelize.sync();
                logger.info('Database synchronized');
            }

            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

        } catch (error) {
            logger.error('MySQL connection failed:', error);
            process.exit(1);
        }
    }

    initializeModels() {
        // Import and initialize models here
        const Invoice = require('../models/invoice.model');
        const SubscriptionPlan = require('../models/subscription-plan.model');

        this.models.Invoice = Invoice.initModel(this.sequelize);
        this.models.SubscriptionPlan = SubscriptionPlan.initModel(this.sequelize);

        logger.info('Models initialized successfully');
    }

    async disconnect() {
        if (this.sequelize) {
            await this.sequelize.close();
            logger.info('MySQL disconnected gracefully');
        }
    }

    getSequelize() {
        return this.sequelize;
    }

    getModels() {
        return this.models;
    }
}

module.exports = new Database();