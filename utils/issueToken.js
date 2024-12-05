const jwt = require('jsonwebtoken');

const issueToken = (user, res, rememberMe) => {
    const payload = { user: { id: user.id, email: user.email } };

    jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;

        if (rememberMe) {
            const rememberMeToken = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '30d' }
            );

            res.cookie('rememberMeToken', rememberMeToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 30 * 24 * 3600000, // 30 days
            });
        }

        res.redirect(`/profile`);
    });
}

module.exports = issueToken;