const express = require('express');
const router = express.Router();

const { register } = require('../controllers/Register');
const { login, logout } = require('../controllers/Login');
const { verifyEmail } = require('../controllers/VerifyEmail');
const { requestResetPassword, resetPassword } = require('../controllers/Password');
const { verifyOTP } = require('../controllers/2faController');

router.post('/register', register);

router.get('/verify/:token', verifyEmail);

router.post('/login', login);

router.post('/logout', logout);

router.post('/forgot-password', requestResetPassword);

router.post('/reset-password', resetPassword);

router.get('/otp-verification/:token', (req, res) => {
    res.render('otp-verification', { token: req.params.token, error: null });
});

router.post('/otp-verification/:token', verifyOTP);

module.exports = router;