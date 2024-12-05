const express = require('express');
const authMiddleware = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = req.user;

        const userData = {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            createdAt: user.createdAt,
        };

        res.render('profile', { user: userData });
    } catch (err) {
        console.error('Profile retrieval error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
