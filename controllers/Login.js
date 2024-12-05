const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/UsersModel');
const { OTPemail } = require('../services/emailServices');
const { generateOTP } = require('../utils/optUtils');
const issueToken = require('../utils/issueToken');
const DeviceServices = require('../services/deviceServices');

exports.login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.verified) {
            return res.status(403).json({ message: 'Account not verified' });
        }

        const currentDevice = DeviceServices.generateFingerprint(req);
        const storedDevice = JSON.parse(user.device_login || '{}').fingerprint;

        if (user.twoFactorEnabled) {
            if (!storedDevice || storedDevice !== currentDevice) {
                const { otp, expiresAt } = generateOTP();
                user.otp = otp;
                user.otpExpiresAt = expiresAt;
                user.device_login = JSON.stringify({
                    fingerprint: currentDevice,
                    ...DeviceServices.getClientInfo(req)
                });
                await user.save();

                await OTPemail({
                    to: user.email,
                    subject: 'New Device Detected - OTP Required',
                    text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
                    html: `<p>Your OTP is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`
                });

                const otpToken = jwt.sign(
                    { userId: user.id },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: '10m' }
                );

                return res.redirect(`/user/otp-verification/${otpToken}`);
            }
        }

        if (storedDevice && storedDevice === currentDevice) {
            return issueToken(user, res, rememberMe);
        }

        user.device_login = JSON.stringify({
            fingerprint: currentDevice,
            ...DeviceServices.getClientInfo(req)
        });
        await user.save();

        return issueToken(user, res, rememberMe);
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.logout = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('rememberMeToken'); 

    res.redirect('/');
};