const express = require('express');
const router = express.Router();

const { register } = require('../controllers/Register');
const { login } = require('../controllers/login');
const { verifyEmail } = require('../controllers/VerifyEmail');
const { requestResetPassword, resetPassword } = require('../controllers/Password');

router.post('/register', register);

router.get('/verify/:token', verifyEmail);

router.post('/login', login);


router.post('/forgot-password', requestResetPassword);

router.post('/reset-password', resetPassword);


module.exports = router;