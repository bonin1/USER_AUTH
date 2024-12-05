const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/UsersModel');
const { sendResetEmail } = require('../services/emailServices');

exports.requestResetPassword = async (req, res) => {
    const token = req.cookies.rememberMeToken; 

    if (!token) {
        return res.status(400).json({ error: 'Authentication token is required' });
    }

    let email;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        email = decoded.email; 
    } catch (err) {
        return res.status(400).json({ error: 'Invalid or expired token', details: err.message });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 30 * 60 * 1000; 
        await user.save();

        await sendResetEmail(email, resetToken, user.name);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send password reset email', details: err.message });
    }
};


exports.resetPassword = async (req, res) => {
    const { newPassword, confirmPassword, token } = req.body;

    if(!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({ where: { email: decoded.email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordResetToken = null; 
        user.passwordResetExpires = null; 
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password', details: err.message });
    }
};

