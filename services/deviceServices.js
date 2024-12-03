const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const NodeCache = require('node-cache');

const cache = new NodeCache({ 
    stdTTL: 3600,
    checkperiod: 600 
});

const rateLimits = new Map();

class DeviceServices {
    constructor(options = {}) {
        this.options = {
            enableGeo: true,
            enableFingerprint: true,
            rateLimit: {
                window: 60 * 1000, 
                max: 100
            },
            ...options
        };
    }
    getDeviceInfo(req) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';
    
        return {
            ip,
            userAgent
        };
    }

    getClientInfo(req) {
        const basicInfo = this.getDeviceInfo(req);
        const geoInfo = this.options.enableGeo ? this.getGeoLocation(basicInfo.ip) : null;
        const fingerprint = this.options.enableFingerprint ? this.generateFingerprint(req) : null;
        const capabilities = this.detectCapabilities(req);

        return {
            ...basicInfo,
            geo: geoInfo,
            fingerprint,
            capabilities,
            deviceType: this.getDeviceType(req),
            isBot: this.isBot(req)
        };
    }

    getGeoLocation(ip) {
        const cacheKey = `geo_${ip}`;
        let geo = cache.get(cacheKey);
        
        if (!geo) {
            geo = geoip.lookup(ip) || null;
            cache.set(cacheKey, geo);
        }
        
        return geo;
    }

    generateFingerprint(req) {
        const components = [
            req.headers['user-agent'],
            req.headers['accept-language'],
            req.headers['accept-encoding'],
            req.headers['accept'],
            req.headers['sec-ch-ua']
        ].filter(Boolean);

        return crypto
            .createHash('sha256')
            .update(components.join('|'))
            .digest('hex');
    }

    detectCapabilities(req) {
        const ua = new UAParser(req.headers['user-agent']);
        return {
            webgl: this.hasWebGL(req),
            cookies: !!req.headers.cookie,
            localStorage: true, // Assumed true for modern browsers
            touchscreen: this.isTouchDevice(req),
            screen: {
                width: req.headers['sec-ch-viewport-width'],
                height: req.headers['sec-ch-viewport-height']
            }
        };
    }

    getDeviceType(req) {
        const ua = new UAParser(req.headers['user-agent']);
        const device = ua.getDevice();
        return device.type || 'desktop';
    }

    isBot(req) {
        const ua = req.headers['user-agent']?.toLowerCase() || '';
        const botPatterns = [
            'bot', 'crawler', 'spider', 'slurp', 'baiduspider',
            'yandexbot', 'facebookexternalhit', 'linkedinbot',
            'twitterbot', 'slackbot'
        ];
        return botPatterns.some(pattern => ua.includes(pattern));
    }

    hasWebGL(req) {
        // Basic assumption based on modern browsers
        const ua = new UAParser(req.headers['user-agent']);
        const browser = ua.getBrowser();
        const modernBrowser = parseInt(browser.version) > 10;
        return modernBrowser;
    }

    isTouchDevice(req) {
        return req.headers['sec-ch-ua-mobile'] === '?1';
    }

    checkRateLimit(ip) {
        const now = Date.now();
        const limit = this.options.rateLimit;
        
        if (!rateLimits.has(ip)) {
            rateLimits.set(ip, [now]);
            return true;
        }

        const requests = rateLimits.get(ip);
        const windowStart = now - limit.window;
        
        // Clean old requests
        while (requests.length && requests[0] < windowStart) {
            requests.shift();
        }

        if (requests.length >= limit.max) {
            return false;
        }

        requests.push(now);
        return true;
    }
}

module.exports = new DeviceServices();