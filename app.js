const express = require('express');
const app = express();
const db = require('./database');
require('dotenv').config();
const cookieParser = require('cookie-parser');


//---------------------------------------------------------------
//models
const User = require('./model/UsersModel');

//---------------------------------------------------------------

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/static', express.static('static'));
app.use(cookieParser());

//---------------------------------------------------------------

//routes
const UserRoute = require('./routes/UserRoute');
app.use('/user', UserRoute);

const profileRoute = require('./routes/Profile');
app.use('/profile', profileRoute);

app.get('/reset-password', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.send("Invalid token");
    }
    res.render('reset-password', { token });
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('Login');
});

app.get('/register', (req, res) => {
    res.render('Register');
});

//---------------------------------------------------------------
app.listen(process.env.PORT, () => {
    console.log(`Server is running ${process.env.BASE_URL}`);
});
