const Sequelize = require('sequelize');
require('dotenv').config()


const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, null, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: false
});


db.authenticate()
    .then(() => console.log("connection has been established"))
    .catch(err => console.error("unable to connect to the database:", err));


    module.exports = db