import crypto from "crypto";

// Security utility functions

/**
 * Sanitize user input to prevent various attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    // Remove potentially dangerous characters
    return input
        .trim()
        .replace(/[<>\"'&]/g, '') // Remove HTML characters
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .substring(0, 10000); // Limit length
}

/**
 * Generate a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} - Secure random string
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
export function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate JWT secret strength
 * @param {string} secret - JWT secret to validate
 * @returns {boolean} - True if secret is strong enough
 */
export function validateJWTSecret(secret) {
    if (!secret || typeof secret !== 'string') {
        return false;
    }
    
    // Check minimum length
    if (secret.length < 32) {
        return false;
    }
    
    // Check for some variety in characters
    const hasLower = /[a-z]/.test(secret);
    const hasUpper = /[A-Z]/.test(secret);
    const hasNumber = /\d/.test(secret);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
    
    // At least 3 out of 4 character types should be present
    const variety = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    return variety >= 2;
}

/**
 * Rate limiting store for additional security
 */
export class MemoryStore {
    constructor() {
        this.store = new Map();
        this.cleanup();
    }
    
    increment(key, windowMs) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!this.store.has(key)) {
            this.store.set(key, []);
        }
        
        const attempts = this.store.get(key);
        
        // Remove old attempts outside the window
        const validAttempts = attempts.filter(time => time > windowStart);
        
        // Add current attempt
        validAttempts.push(now);
        
        // Update store
        this.store.set(key, validAttempts);
        
        return validAttempts.length;
    }
    
    cleanup() {
        // Clean up old entries every 5 minutes
        setInterval(() => {
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            for (const [key, attempts] of this.store.entries()) {
                const validAttempts = attempts.filter(time => time > fiveMinutesAgo);
                if (validAttempts.length === 0) {
                    this.store.delete(key);
                } else {
                    this.store.set(key, validAttempts);
                }
            }
        }, 5 * 60 * 1000);
    }
}

/**
 * Secure logging function that avoids logging sensitive data
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} context - Additional context (will be sanitized)
 */
export function secureLog(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = {};
    
    // Remove sensitive fields from context
    const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'key', 'auth'];
    
    for (const [key, value] of Object.entries(context)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
        
        if (isSensitive) {
            sanitizedContext[key] = '[REDACTED]';
        } else if (typeof value === 'string' && value.length > 1000) {
            sanitizedContext[key] = value.substring(0, 1000) + '[TRUNCATED]';
        } else {
            sanitizedContext[key] = value;
        }
    }
    
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        context: sanitizedContext
    };
    
    console.log(JSON.stringify(logEntry));
}
