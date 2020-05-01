require('dotenv').config();
const express = require('express');
const app = express();
const flash = require("connect-flash");
const session = require('express-session');
const path = require("path");
const bodyParser = require("body-parser");
const passport = require('passport');
const router = require("../router/router.js");
const mongoose = require("mongoose");
const mixpanel = require('mixpanel-browser');
require('../config/passport.config.js')(passport);

mongoose.connect('mongodb://localhost/auth', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mixpanel.init("eb0a30592efe286cce4daa7c8b19bee4");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("./public"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {},
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

if (app.get("env") === "production") {
    // Serve secure cookies, requires HTTPS
    session.cookie.secure = true;
}

app.use("/", router);

module.exports = app;