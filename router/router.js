const express = require("express");
const router = express.Router();
const passport = require("passport");
const util = require("util");
const url = require("url");
const querystring = require("querystring");
const { v4: uuidv4 } = require('uuid');
const User = require("../models/user.model");
const urlMetadata = require("url-metadata");
const getFavicons = require('get-website-favicon');
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

//Homepage
router.get("/", isNotLoggedIn, (req, res) => {
    res.render("home");
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
    res.redirect(`/user/dashboard`)
});

router.get("/user/:folderId", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(req.params.folderId == "dashboard"){
        res.render("dashboard", { user: user, message: req.flash("message")});
    }else{
        let display = null;
        user.content.forEach(folder => {
            if(folder.id == req.params.folderId && folder.type == "folder"){
                display = folder;
            }
        });
        res.render("folder", {folder: display, user: user, message: req.flash("message")});
    }
});

//Create Bookmark
router.post("/bookmarks", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    let url = req.body.url;
    const protocol = url.substring(0, req.body.url.indexOf(':'));
    if (protocol == "") {
        //Enables flexibility in url
        url = `http://${url}`;
    }
    url = removeQuery(url);
    if(validURL(url)){
        const metadata = await urlMetadata(url).then(
            (metadata) => {
                return {
                    imgUrl: metadata.image,
                    title: metadata.title,
                    desc: metadata.description
                };
            },
            (error) => {
                console.log(error);
            }
        );
        const flavicons = await getFavicons(url).then(
            data => {
                return data;
            },
            error =>{
                console.log(error);
            }
        );
        const flavIndex = getIdealFalviconIndex(flavicons.icons);
        if(metadata == undefined){
            user.content.push({
                id: uuidv4(),
                folderId: req.query.folderId,
                type: "bookmark",
                content: {
                    url: url,
                    notes: req.body.notes,
                    imgUrl: '',
                    flavUrl: flavIndex == -1 ? '' : flavicons.icons[flavIndex].src,
                    title: removeQuery(url),
                    desc: ''
                }
            });
        }else{
            user.content.push({
                id: uuidv4(),
                folderId: req.query.folderId,
                type: "bookmark",
                content: {
                    url: url,
                    notes: req.body.notes,
                    imgUrl: validURL(metadata.imgUrl) ? metadata.imgUrl : "",
                    flavUrl: flavIndex == -1 ? '' : flavicons.icons[flavIndex].src,
                    title: metadata.title,
                    desc: metadata.desc
                }
            });
        }
        for(let i = 0; i < user.content.length; i++){
            if (user.content[i].id == req.query.folderId) {
                user.content.set(i, {
                    id: user.content[i].id,
                    name: user.content[i].name,
                    type: user.content[i].type,
                    bookmarkCount: user.content[i].bookmarkCount + 1 
                });
            }
        }
        try {
            if (req.query.folderId == "dashboard") {
                user.bookmarkCount++;
            }
            await user.save();
            mixpanel.track("Bookmark Added", {
                user_id: user.user_id,
                url: url,
                notes: req.body.notes.length > 0 ? 1 : 0
            });
            if (req.query.folderId == "dashboard") {
                res.redirect("/bookmarks");
            } else {
                res.redirect(`/user/${req.query.folderId}`);
            }
        } catch (err) {
            res.status(400);
        }
    } else {
        req.flash('message', "Sorry, that url is invalid.");
        if (req.query.folderId == "dashboard") {
            res.redirect("/bookmarks");
        } else {
            res.redirect(`/user/${req.query.folderId}`);
        }
    }
});

//Create Folder
router.post("/folder", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    if(user.folderCount < 3){
        user.content.push({
            id: uuidv4(),
            name: req.body.name,
            type: "folder",
            bookmarkCount: 0
        });
        user.folderCount++;
        try {
            await user.save();
            mixpanel.track("Folder added", {
                user_id: user.user_id
            });
            res.redirect("/bookmarks");
        } catch (err) {
            res.status(400);
        }
    }else{
        req.flash('message', "Sorry, you can't have more than 3 folders.");
        res.redirect("/bookmarks");
    }
});

// UI NOTE - flash warning message if deleting a folder with contents

//Delete bookmark or folder
router.post("/delete", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    let folderId;
    if(req.query.id != null){
        for(let i = 0; i < user.content.length; i++){
            if (user.content[i].id == req.query.id){
                folderId = user.content[i].folderId;
                if(user.content[i].type == "folder"){
                    user.folderCount--;
                    for(let k = 0; k < user.content.length; k++){
                       if(user.content[k].folderId == user.content[i].id){
                           user.content.splice(k, 1);
                           k--;
                       }
                    }
                }else if(folderId != "dashboard"){
                    for(let g = 0; g < user.content.length; g++){
                        if (user.content[g].id == user.content[i].folderId) {
                            user.content.set(g, {
                                id: user.content[g].id,
                                name: user.content[g].name,
                                type: user.content[g].type,
                                bookmarkCount: user.content[g].bookmarkCount - 1
                            });
                        }
                    }
                }else if(folderId == "dashboard"){
                    user.bookmarkCount--;
                }
                user.content.splice(i, 1);
                mixpanel.track("Entity Deleted", {
                    user_id: user.user_id,
                    entity_type: user.content[i].type 
                });
            }
        }
        try {
            await user.save();
            if (folderId == "dashboard" || folderId == undefined) {
                res.redirect("/bookmarks");
            } else {
                res.redirect(`/user/${folderId}`);
            }
        } catch (err) {
            res.status(400);
        }
    }else{
        req.flash('message', "Invalid id for deletion");
        res.redirect("/bookmarks");
    }
});

//Update bookmark or folder
router.post("/update", isLoggedIn, async (req, res) => {
    const user = await User.findOne({ user_id: req.user.user_id });
    let folderId;
    let goodNewId = false;
    if(req.query.id != null){
        for (let i = 0; i < user.content.length; i++) {
            if (user.content[i].id == req.query.id) {
                folderId = user.content[i].folderId;
                if(user.content[i].type == "bookmark"){
                    if (user.content[i].folderId == req.body.newFolder) {
                        goodNewId = true;
                    } else if (req.body.newFolder == "dashboard") {
                        goodNewId = true;
                    } else {
                        user.content.forEach(entity => {
                            if (entity.id == req.body.newFolder) {
                                goodNewId = true;
                            }
                        });
                    }
                    if(!goodNewId){
                        req.flash('message', "Invalid target folder");
                    }
                    if(goodNewId && user.content[i].folderId != req.body.newFolder){
                        if(user.content[i].folderId == "dashboard"){
                            user.bookmarkCount--;
                        }else{
                            for (let g = 0; g < user.content.length; g++) {
                                if (user.content[i].folderId == user.content[g].id) {
                                    user.content.set(g, {
                                        id: user.content[g].id,
                                        name: user.content[g].name,
                                        type: user.content[g].type,
                                        bookmarkCount: user.content[g].bookmarkCount - 1
                                    });
                                }
                            }
                        }
                        if(req.body.newFolder == "dashboard"){
                            user.bookmarkCount++;
                        }else{
                            for (let g = 0; g < user.content.length; g++) {
                                if (user.content[g].id == req.body.newFolder) {
                                    user.content.set(g, {
                                        id: user.content[g].id,
                                        name: user.content[g].name,
                                        type: user.content[g].type,
                                        bookmarkCount: user.content[g].bookmarkCount + 1
                                    });
                                }
                            }
                        }
                    }
                    user.content.set(i, {
                        id: user.content[i].id,
                        folderId: goodNewId ? req.body.newFolder : user.content[i].folderId,
                        type: user.content[i].type,
                        content:{
                            url: user.content[i].content.url,
                            notes: req.body.notes,
                            imgUrl: user.content[i].content.imgUrl,
                            title: req.body.title,
                            desc: user.content[i].content.desc
                        }
                    });
                }else{
                    user.content.set(i, {
                        id: user.content[i].id,
                        name: req.body.name,
                        type: user.content[i].type,
                        bookmarkCount: user.content[i].bookmarkCount
                    })
                }
                mixpanel.track("Entity Updated", {
                    user_id: user.user_id,
                    entity_type: user.content[i].type
                });
            }
        }
        try {
            await user.save();
            if (folderId == "dashboard" || folderId == undefined) {
                res.redirect("/bookmarks");
            } else {
                res.redirect(`/user/${folderId}`);
            }
        } catch (err) {
            res.status(400);
        }
    }else{
        req.flash('message', "Invalid update id");
        res.redirect("/bookmarks");
    }
});

function isLoggedIn(req, res, next){
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect("/");
}

function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated())
        return next();
    res.redirect("/bookmarks");
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

function getIdealFalviconIndex(flav){
    let bestSize = 0;
    let bestSizeIndex;
    for(let i = 0; i < flav.length; i++){
        if(flav[i].sizes != ''){
            const length = flav[i].sizes.substring(0, flav[i].sizes.indexOf("x"));
            const height = flav[i].sizes.substring(flav[i].sizes.indexOf("x") + 1);
            if(length == height){
                if(length > bestSize){
                    bestSize = length;
                    bestSizeIndex = i;
                }
            }
        }
    }
    if(bestSizeIndex != undefined){
        return bestSizeIndex;
    }else{
        return -1;
    }
}

module.exports = router;