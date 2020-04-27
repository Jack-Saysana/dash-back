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
        let display = null;
        user.content.forEach(folder => {
            if(folder.id == req.params.folderId){
                display = folder.content;
            }
        });
    }
});

//Create Bookmark
router.post("/bookmarks", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(req.params.folderId == "dashboard"){
        user.content.push({
            id: uuid(),
            type: "bookmark"
            //Bookmark attributes
        });
    }else{
        user.content.forEach(folder => {
            if(folder.id == req.params.folderId){
                folder.content.push({
                    id: uuid(),
                    type: "bookmark"
                    //Bookmark attributes
                })
            }
        });
    }
    try {
        await user.save();
        res.redirect("/bookmarks");
    } catch (err) {
        res.status(400);
    }
});

//Create Folder
router.post("/folder", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(user.folderCount < 3){
        user.content.push({
            id: uuid(),
            type: "folder",
            content: []
        });
        user.folderCount++;
        try {
            await user.save();
            res.redirect("/bookmarks");
        } catch (err) {
            res.status(400);
        }
    }else{
        res.json({message: "Max folders 3"});
    }
});

// UI NOTE - flash warning message if deleting a folder with contents

//Delete bookmark or folder
router.post("/delete", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(req.params.id != null){
        for(let i = 0; i < user.content.length; i++){
            if(user.content[i].id == req.params.id){
                user.content.splice(i, 1);
            }else if(user.content[i].type == "folder"){
                //Check inside folders
                for(let g = 0; g < user.content[i].content.length; g++){
                    if (user.content[i].content[g].id == req.params.id){
                        user.content[i].content.splice(g, 1);
                    }
                }
            }
        }
        try {
            await user.save();
            res.redirect("/bookmarks");
        } catch (err) {
            res.status(400);
        }
    }
});

//Update bookmark
router.post("/update", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
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