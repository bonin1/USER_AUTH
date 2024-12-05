const jwt = require('jsonwebtoken');
const Users = require('../model/UsersModel');
const { hashPassword } = require('../utils/hashpasswords');
const emailService = require('../services/emailServices');
const DeviceServices = require('../services/deviceServices'); // Import DeviceServices

const sendVerificationEmail = async (email, username, token) => {
    try {
        await emailService.sendVerificationEmail(email, username, token);
    } catch (error) {
        console.log(error);
    }
};

exports.register = async (req, res) => {
    try {
        const { name, lastname, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide an email and password' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        const user = await Users.findOne({
            where: { email }
        });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Retrieve device information using DeviceServices
        const deviceInfo = DeviceServices.getClientInfo(req);

        const newUser = await Users.create({
            name,
            lastname,
            email,
            password: hashedPassword,
            verified: false,
            device_login: JSON.stringify({
                ip: deviceInfo.ip,
                userAgent: deviceInfo.userAgent,
                deviceType: deviceInfo.deviceType,
                isBot: deviceInfo.isBot
            })
        });

        // Generate verification token
        const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        // Send verification email
        await sendVerificationEmail(email, name, token);

        return res.status(201).json({ message: 'User registered' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
