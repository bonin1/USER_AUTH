const crypto = require('crypto');

// Generate OTP and expiration time
function generateOTP(length = 6) {
    const otp = crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    return { otp, expiresAt };
}

module.exports = {
    generateOTP,
};
