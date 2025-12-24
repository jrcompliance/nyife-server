const ApiError = require('../utils/ApiError');
// const cache = require('../utils/cache');
const database = require('../config/database');
const logger = require('../utils/logger');

class GstService {
    constructor() {
        this.POLL_INTERVAL = 2 * 1000; // 2 seconds
        this.MAX_POLL_TIME = 1 * 10 * 1000; // 50 seconds
        // this.CACHE_TTL = 3600; // 1 hour

    }

    getGstInfo() {
        return database.getModels().GstInfo;
    }

    validateGstNumber(gstNumber) {
        if (!gstNumber || typeof gstNumber !== 'string') {
            throw ApiError.badRequest('GST number is required');
        }

        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const cleanGst = gstNumber.toUpperCase().trim();

        if (cleanGst.length !== 15) {
            throw ApiError.badRequest('GST number must be exactly 15 characters');
        }

        if (!gstRegex.test(cleanGst)) {
            throw ApiError.badRequest('Invalid GST number format');
        }
        return cleanGst;

    }

    async getOrCreateGstInfo(gstNumber) {
        const GstInfo = this.getGstInfo();
        const validGst = this.validateGstNumber(gstNumber);

        let gstInfo = await GstInfo.findOne({
            where: { gst_number: validGst },
            raw: true
        });

        if (!gstInfo) {
            await GstInfo.create({
                gst_number: validGst,
                status: false,
                gst_data: null,
                requested_at: new Date(),
            });
            logger.info(`New GST record created: ${validGst}`);
            return null;
        }

        return gstInfo;

    }

    async isGstExists(gstNumber) {
        const GstInfo = this.getGstInfo();
        const validGst = this.validateGstNumber(gstNumber);

        const gstInfo = await GstInfo.findOne({
            where: { gst_number: validGst },
            raw: true
        });

        if (!gstInfo) {
            throw ApiError.notFound('GST record not found');
        }

        return {
            id: gstInfo.id,
            gst_number: gstInfo.gst_number,
            status: gstInfo.status,
            gst_data: gstInfo.gst_data,
            requested_at: gstInfo.requested_at,
            completed_at: gstInfo.completed_at,
        };

    }

    async pollGstData(gstNumber) {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const elapsed = Date.now() - startTime;

                    if (elapsed >= this.MAX_POLL_TIME) {
                        logger.warn(`GST polling timeout for ${gstNumber}`);
                        return reject(
                            ApiError.tooManyRequests(
                                'GST verification timeout. Please try again later.'
                            )
                        );
                    }

                    const gstInfo = await this.isGstExists(gstNumber);

                    if (gstInfo?.status === true && gstInfo?.gst_data) {
                        logger.info(`GST data retrieved: ${gstNumber}`);
                        return resolve(gstInfo);
                    }

                    setTimeout(poll, this.POLL_INTERVAL);

                } catch (error) {
                    logger.error(`GST polling error for ${gstNumber}`, error);

                    // Preserve ApiError
                    if (error instanceof ApiError) {
                        return reject(error);
                    }

                    // Convert unknown errors
                    return reject(
                        ApiError.internal(
                            error?.message || 'GST verification failed'
                        )
                    );
                }
            };

            poll();
        });
    }


    async verifyGst(gstNumber) {
        try {
            const gstInfo = await this.getOrCreateGstInfo(gstNumber);

            if (gstInfo?.status && gstInfo?.gst_data) {
                logger.info(`GST data retrieved : ${gstNumber}`);
                return gstInfo;
            }

            return await this.pollGstData(gstNumber);

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new GstService();