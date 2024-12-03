const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/UsersModel');
const DeviceServices = require('../services/deviceServices');



exports.login = async (req, res) => {
    const { name, email, password, rememberMe } = req.body;

    try {
        // Retrieve user by email
        const user = await User.findOne({
            where: { email: email }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const deviceInfo = DeviceServices.getClientInfo(req);


        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;

            if (rememberMe) {
                const rememberMeToken = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        device: deviceInfo,
                        role: user.role
                    },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: '30d' }
                );

                res.cookie('rememberMeToken', rememberMeToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
                    maxAge: 30 * 24 * 3600000, 
                    path: '/'
                });
            }

            return res.status(200).json({
                message: 'Login successful'
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
