const express = require('express');
const router = express.Router();

const { register } = require('../controllers/Register');
const { login } = require('../controllers/Login');
const { verifyEmail } = require('../controllers/VerifyEmail');
const { requestResetPassword, resetPassword } = require('../controllers/Password');
const {verify2FA} = require('../controllers/2faController');

router.post('/register', register);

router.get('/verify/:token', verifyEmail);

router.post('/login', login);


router.post('/forgot-password', requestResetPassword);

router.post('/reset-password', resetPassword);

router.post('/2fa', verify2FA);

module.exports = router;