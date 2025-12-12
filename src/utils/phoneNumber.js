// utils/phoneNumber.js

/**
 * Sanitize phone number to Razorpay format (works globally)
 * @param {string} phone - Phone number in any format
 * @param {string} defaultCountryCode - Default country code (default: +91)
 * @returns {string} - Formatted phone number with country code
 */
function sanitizePhoneNumber(phone, defaultCountryCode = '+91') {
    if (!phone) return null;

    // Remove all non-digit characters except +
    let cleaned = String(phone).trim().replace(/[^\d+]/g, '');

    // Handle international format starting with 00
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
    }

    // If doesn't start with +, add country code
    if (!cleaned.startsWith('+')) {
        // Remove leading zeros
        cleaned = cleaned.replace(/^0+/, '');
        cleaned = defaultCountryCode + cleaned;
    }

    // Validate: must be +[1-4 digit country code][6-13 digit number]
    if (!/^\+[1-9]\d{9,14}$/.test(cleaned)) {
        throw new Error('Invalid phone number format');
    }

    return cleaned;
}

/**
 * Validate phone number
 */
function isValidPhoneNumber(phone, defaultCountryCode = '+91') {
    try {
        const sanitized = sanitizePhoneNumber(phone, defaultCountryCode);
        return sanitized !== null;
    } catch {
        return false;
    }
}

module.exports = {
    sanitizePhoneNumber,
    isValidPhoneNumber
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// India
sanitizePhoneNumber("+91 88002 81734")           // +918800281734
sanitizePhoneNumber("88002 81734", "+91")        // +918800281734
sanitizePhoneNumber("0 88002 81734")             // +918800281734

// USA
sanitizePhoneNumber("+1 (123) 456-7890")         // +11234567890
sanitizePhoneNumber("123-456-7890", "+1")        // +11234567890

// UK
sanitizePhoneNumber("+44 7911 123456")           // +447911123456
sanitizePhoneNumber("07911 123456", "+44")       // +447911123456

// UAE
sanitizePhoneNumber("+971 50 123 4567")          // +971501234567
sanitizePhoneNumber("050 123 4567", "+971")      // +971501234567

// Singapore
sanitizePhoneNumber("+65 9123 4567")             // +6591234567
sanitizePhoneNumber("91234567", "+65")           // +6591234567

// Validation
isValidPhoneNumber("+91 88002 81734")            // true
isValidPhoneNumber("invalid")                    // false
*/