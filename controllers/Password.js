const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/UsersModel');
const { sendResetEmail } = require('../services/emailServices');

exports.requestResetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });

        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 30 * 60 * 1000; 
        await user.save();



        await sendResetEmail(email, token, user.name);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send password reset email', details: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const user = await User.findOne({ where: { email: decoded.email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
            return res.status(400).json({ error: 'Password reset token has expired' });
        }

        if (user.passwordResetToken == null) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetToken = null;     
        user.passwordResetExpires = null;   
        await user.save();

        return res.status(200).json({ message: 'Password reset successful, token invalidated' });
    } catch (err) {
        console.error("Error during password reset:", err);
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
};
