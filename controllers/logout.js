
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('rememberMeToken'); 
    req.session.user = null;

    res.status(200).json({ message: 'Logout successful' });
};