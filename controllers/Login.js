const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../model/UsersModel');
const { OTPemail } = require('../services/emailServices');
const { generateOTP } = require('../utils/optUtils');

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

        const rememberMeToken = req.cookies?.rememberMeToken;
        if (rememberMeToken) {
            try {
                const decodedToken = jwt.verify(rememberMeToken, process.env.JWT_SECRET_KEY);
                if (decodedToken.id === user.id) {
                    return issueToken(user, res, rememberMe);
                }
            } catch (err) {
                console.warn('Invalid or expired rememberMeToken:', err.message);
            }
        }

        const { otp, expiresAt } = generateOTP();
        user.otp = otp;
        user.otpExpiresAt = expiresAt;
        await user.save();

        await OTPemail({
            to: user.email,
            subject: 'Your OTP for Two Factor Authentication',
            text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
            html: `<p>Your OTP is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`,
        });

        res.status(200).json({
            message: 'OTP sent to your email. Please verify.',
            otpSent: true,
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

function issueToken(user, res, rememberMe) {
    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;

        if (rememberMe) {
            const rememberMeToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '30d' }
            );

            res.cookie('rememberMeToken', rememberMeToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 30 * 24 * 3600000, // 30 days
            });
        }

        res.status(200).json({ message: 'Login successful', token });
    });
}
