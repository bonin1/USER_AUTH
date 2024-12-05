const express = require('express');
const router = express.Router();
const User = require('../model/UsersModel');
const jwt = require('jsonwebtoken');
const issueToken = require('../utils/issueToken2fa');
const DeviceServices = require('../services/deviceServices');

exports.verifyOTP = async (req, res) => {
    const {token} = req.params;
    const { otp } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.otp = null; 
        user.otpExpiresAt = null;

        const newDeviceFingerprint = DeviceServices.generateFingerprint(req);
        user.device_login = JSON.stringify({
            fingerprint: newDeviceFingerprint,
            ...DeviceServices.getClientInfo(req)
        });

        await user.save();

        return issueToken(user, res, false);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Token has expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token' });
        }
        console.error('OTP verification error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};


