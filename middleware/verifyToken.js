const jwt = require('jsonwebtoken');
const User = require('../model/UsersModel');

const authMiddleware = async (req, res, next) => {
    const token = req.params.token || req.query.token || req.cookies.rememberMeToken;

    if (!token) {
        return res.status(401).json({ message: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Fetch the user from the database
        const user = await User.findOne({ where: { id: decoded.id || decoded.user.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Token validation error:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
