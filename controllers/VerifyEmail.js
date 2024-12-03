const User = require('../model/UsersModel');
const jwt = require('jsonwebtoken');

// VERIFY EMAIL 
exports.verifyEmail = async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({ where: { name: decoded.name } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.verified) {
            return res.status(400).json({ error: 'User is already verified' });
        }

        user.verified = true;
        await user.save();

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Verification token has expired' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'Invalid verification token' });
        }
        next(err);
    }
};