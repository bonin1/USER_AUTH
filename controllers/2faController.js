const express = require('express');
const router = express.Router();
const User = require('../model/UsersModel');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.verify2FA = async (req, res) => {
        const { otp } = req.body;

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await User.findOne({
                where: {
                    otp: otp,
                    otpExpiresAt: { [Op.gt]: new Date() },
                },
            });

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }

            user.otp = null;
            user.otpExpiresAt = null;
            await user.save();

            const payload = { user: { id: user.id } };
            jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: 3600 }, (err, token) => {
                if (err) throw err;

                return res.status(200).json({
                    message: 'OTP verified successfully',
                    token,
                });
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
