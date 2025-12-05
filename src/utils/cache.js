const redis = require('redis');
const config = require('../config/env');
const logger = require('./logger');

class CacheManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = redis.createClient({
                url: config.redis.url,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger.error('Redis max reconnection attempts reached');
                            return new Error('Max reconnection attempts');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => logger.error('Redis Client Error', err));
            this.client.on('connect', () => logger.info('Redis connected'));
            this.client.on('disconnect', () => logger.warn('Redis disconnected'));

            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            logger.error('Redis connection failed:', error);
            this.isConnected = false;
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        if (!this.isConnected) return false;
        try {
            await this.client.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }

    async clear(pattern = '*') {
        if (!this.isConnected) return false;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache clear error:', error);
            return false;
        }
    }
}

module.exports = new CacheManager();