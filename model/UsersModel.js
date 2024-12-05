const { DataTypes } = require('sequelize');
const db = require('../database');


const Users = db.define('users', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'admin', 'professor'),
        allowNull: false,
        defaultValue: 'student'
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    device_login: {
        type: DataTypes.TEXT,
        allowNull: true
    },  
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    otp: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    otpExpiresAt: {
        type: DataTypes.DATE, 
        allowNull: true
    },
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN, 
        allowNull: false,
        defaultValue: false
    },
},{
    freezeTableName: true,
    timestamps: false
});

Users.sync({ force: false }).then(() => {
    console.log('User table synced');
}).catch(err => {
    console.error('Error syncing User table:', err);
});

module.exports = Users;