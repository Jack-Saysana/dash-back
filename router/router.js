const express = require("express");
const router = express.Router();
const passport = require("passport");
const util = require("util");
const url = require("url");
const querystring = require("querystring");
const uuid = require("uuid/v4");
const User = require("../models/user.model");
const urlMetadata = require("url-metadata");
require("dotenv").config();

//Login Handling
router.get(
    "/login",
    passport.authenticate("auth0", {
        scope: "openid email profile"
    }),
    (req, res) => {
        res.redirect("/bookmarks");
    }
);

router.get("/callback", (req, res, next) => {
    passport.authenticate("auth0", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect("/login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            const returnTo = req.session.returnTo;
            delete req.session.returnTo;
            res.redirect(returnTo || "/bookmarks");
        });
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    req.logOut();

    let returnTo = req.protocol + "://" + req.hostname;
    const port = req.connection.localPort;

    if (port !== undefined && port !== 80 && port !== 443) {
        returnTo =
            process.env.NODE_ENV === "production"
                ? `${returnTo}/`
                : `${returnTo}:${port}/`;
    }

    const logoutURL = new URL(
        util.format("https://%s/logout", process.env.AUTH0_DOMAIN)
    );
    const searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo: returnTo
    });
    logoutURL.search = searchString;

    res.redirect(logoutURL);
});

//Bookmarks
router.get("/bookmarks", isLoggedIn, async (req, res) => {
    const user = await User.findOne({user_id: req.user.user_id});
    if(user == null){
        const newUser = new User({
            user_id: req.user.user_id,
            content: []
        });
        newUser.save();
    }
    res.redirect(`/user/${req.user.displayName}/dashboard`)
});

router.get("/user/:name/:folderId", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(req.params.folderId == "dashboard"){
        res.send(user.content);
    }else{
        
    }
});

router.post("/bookmarks", async (req, res) => {

});

router.post("/delete", (req, res) => {

});

router.post("/update", (req, res) => {

});

function isLoggedIn(req, res, next){
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect("/");
}

function removeQuery(link){
    if (link.indexOf("?") > 0) {
        return link.substring(0, link.indexOf("?"));
    } else {
        return link;
    }
};

function validURL(myURL) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + //port
        '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i');
    return pattern.test(myURL);
}

module.exports = router;