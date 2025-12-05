const helmet = require('helmet');
const config = require('./env');

class SecurityConfig {
    // Helmet configuration for HTTP headers security
    getHelmetConfig() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: true,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: 'deny' },
            hidePoweredBy: true,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            ieNoOpen: true,
            noSniff: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            xssFilter: true,
        };
    }

    // CORS configuration
    getCorsConfig() {
        const whitelist = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'];

        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin || whitelist.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
            ],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            maxAge: 600, // 10 minutes
        };
    }

    // Password validation rules
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password),
        };
    }

    // Calculate password strength score (0-100)
    calculatePasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        if (password.length >= 16) strength += 10;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/\d/.test(password)) strength += 15;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

        return Math.min(strength, 100);
    }

    // Sanitize user input to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/[<>]/g, '') // Remove < and >
            .trim();
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Generate secure random token
    generateSecureToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

    // Hash sensitive data (for logging purposes)
    hashSensitiveData(data) {
        const crypto = require('crypto');
        return crypto
            .createHash('sha256')
            .update(data.toString())
            .digest('hex')
            .substring(0, 16);
    }

    // IP address validation
    isValidIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    // SQL injection prevention - escape special characters
    escapeSqlInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                switch (char) {
                    case '\0': return '\\0';
                    case '\x08': return '\\b';
                    case '\x09': return '\\t';
                    case '\x1a': return '\\z';
                    case '\n': return '\\n';
                    case '\r': return '\\r';
                    case '"':
                    case "'":
                    case '\\':
                    case '%':
                        return '\\' + char;
                    default:
                        return char;
                }
            });
    }

    // Check for common attack patterns
    containsMaliciousPattern(input) {
        if (typeof input !== 'string') return false;

        const maliciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi, // Script tags
            /javascript:/gi, // JavaScript protocol
            /on\w+\s*=/gi, // Event handlers
            /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi, // SQL keywords
            /\.\.\//, // Directory traversal
            /%00/, // Null byte
        ];

        return maliciousPatterns.some(pattern => pattern.test(input));
    }

    // Rate limiting configuration by endpoint type
    getRateLimitConfig(type = 'default') {
        const configs = {
            default: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100,
                message: 'Too many requests, please try again later',
            },
            auth: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 5, // Strict limit for auth endpoints
                message: 'Too many login attempts, please try again later',
            },
            api: {
                windowMs: 1 * 60 * 1000, // 1 minute
                max: 60,
                message: 'API rate limit exceeded',
            },
            strict: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 10,
                message: 'Action limit exceeded, please try again later',
            },
        };

        return configs[type] || configs.default;
    }

    // Security headers middleware configuration
    getSecurityHeaders() {
        return (req, res, next) => {
            // Prevent clickjacking
            res.setHeader('X-Frame-Options', 'DENY');

            // Prevent MIME type sniffing
            res.setHeader('X-Content-Type-Options', 'nosniff');

            // Enable XSS protection
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Referrer policy
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            // Permissions policy
            res.setHeader(
                'Permissions-Policy',
                'geolocation=(), microphone=(), camera=()'
            );

            // Remove server information
            res.removeHeader('X-Powered-By');

            next();
        };
    }

    // API key validation (for external API integrations)
    validateApiKey(apiKey) {
        const validApiKeys = process.env.API_KEYS
            ? process.env.API_KEYS.split(',')
            : [];

        return validApiKeys.includes(apiKey);
    }

    // Generate API key
    generateApiKey() {
        const crypto = require('crypto');
        const prefix = 'sk_';
        const randomPart = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        return `${prefix}${randomPart}`;
    }
}

module.exports = new SecurityConfig();