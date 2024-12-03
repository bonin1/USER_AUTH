const bcrypt = require('bcryptjs');

exports.hashPassword = async (password) => {
    const saltRounds = 8; 
    return await bcrypt.hash(password, saltRounds);
};
