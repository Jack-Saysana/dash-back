const express        = require( "express" );
const router         = express.Router();
const passport       = require( "passport" );
const request        = require( "request" );
const util           = require( "util" );
const url            = require( "url" );
const querystring    = require("querystring");
const { v4: uuidv4 } = require('uuid');
const apiv1Router    = require( "./router-api-v1.js" );
const APIv1          = require( "./api-v1.js" );

const User = require("../models/user.model").userSchema;
const Folder = require("../models/user.model").folderScheme;
const Bookmark = require("../models/user.model").contentScheme;

const urlMetadata = require("url-metadata");
const getFavicons = require('get-website-favicon');
require("dotenv").config();
var mixpanel = require( "mixpanel" ).init( "7c2c2239897c7c2d76e501beb27ef81d" );


// load API v1
router.use( "/api/v1/", apiv1Router );

//Login Handling
router.get(
    "/login",
    passport.authenticate("auth0", {
        scope: "openid email profile"
    }), (req, res) => {
        res.redirect("/bookmarks");
    }
);

// Create Account FIXME not taking to signup page
router.get( "/signup",
    passport.authenticate("auth0", {
        initialScreen: "SignUp"
    }), (req, res) => {
        res.redirect("/bookmarks");
    }
);


router.get("/callback", (req, res, next) => {
  // deals with if email isn't verified yet
  if ( req.query && req.query.error ) {
    res.render( "verify-email.ejs" );
  } else {
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
  }
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
        returnTo: process.env.AUTH0_LOGOUT_URL  || returnTo
    });
    logoutURL.search = searchString;

    res.redirect(logoutURL);
});

//Homepage
router.get("/", isNotLoggedIn, (req, res) => {
    res.render( "landing" );
});

//Bookmarks
router.get("/bookmarks", isLoggedIn, async (req, res) => {
    const user = await User.findOne({user_id: req.user.user_id});
    if(user == null){
        let newUser = new User({
            user_id: req.user.user_id
        });
        //newUser.content.folder.push( new Folder( { name: "Dashboard" } ) );
        //newUser.content.dashboard = newUser.content.folder[ newUser.content.folder.length ]._id;
        newUser.save();
    }
    res.redirect(`/user/dashboard`)
});

router.get("/user/:folderId", isLoggedIn, async (req, res) => {
    User.findOne({ user_id: req.user.user_id }, async (err, user) => {
        if(err){
            throw err;
        }else if(req.params.folderId == "dashboard"){
            res.render("dashboard", { user: user, externalUrl: decodeURIComponent(req.query.url), message: req.flash("message") });
        }else{
            let folder = user.content.folder.id(req.params.folderId);
            res.render("folder", { folder: folder, user: user, message: req.flash("message") });
        }
    }).catch(err => {
        res.json(err);
    });
});

//Create Bookmark
router.post("/bookmarks", isLoggedIn, async (req, res) => {
    User.findOne({ user_id: req.user.user_id }, async (err, user) => {
        let url = req.body.url.substring(0, req.body.url.indexOf(':')) == "" ? `http://${req.body.url}` : req.body.url;
        if(validURL(url)){
            let metadata = await urlMetadata(url).then(
                (metadata) => {
                    return metadata;
                },
                (error) => {
                    console.log(error);
                }
            );
            const flavicons = await getFavicons(url).then(
                data => {
                    return data;
                },
                error => {
                    console.log(error);
                }
            );
            const flavIndex = getIdealFalviconIndex(flavicons.icons);
            if(metadata != undefined){
                metadata["flavUrl"] = flavIndex == -1 ? '' : flavicons.icons[flavIndex].src;
                metadata.image = validURL(metadata.image) ? metadata.image : "";
            }else{
                metadata = {
                    url: url,
                    title: url,
                    image: "",
                    description: "",
                    flavUrl: ""
                }
            }
            if(req.body.folder == "dashboard"){
                user.content.dashboard.push(new Bookmark({
                    url: url,
                    notes: req.body.notes,
                    meta: metadata
                }));
            }else{
                user.content.folder.id(req.body.folder).content.push(new Bookmark({
                    url: url,
                    notes: req.body.notes,
                    meta: metadata
                }));
            }
            try{
                user.save();
                mixpanel.track("Bookmark Added", {
                    distinct_id: user.user_id,
                    url: url,
                    notes: req.body.notes.length > 0 ? 1 : 0
                });
                if (req.body.folder == "dashboard") {
                    res.redirect("/bookmarks");
                } else {
                    res.redirect(`/user/${req.body.folder}`);
                }
            }catch{
                res.status(400);
            }
        }else{
            req.flash("message", "Sorry, invalid url");
            res.redirect("/bookmarks");
        }
    }).catch(err => {
        res.json(err);
    });
});

//Create Folder
router.post("/folder", isLoggedIn, async (req, res) => {
    User.findOne({ user_id: req.user.user_id }, async (err, user) => {
        if(err){
            throw err;
        }else if(user.content.folder.length < 3){
            user.content.folder.push(new Folder({
                name: req.body.name
            }));
            try{
                await user.save();
                mixpanel.track("Folder added", {
                    distinct_id: user.user_id
                });
                res.redirect("/bookmarks");
            }catch{
                res.status(400);
            }
        }else{
            req.flash('message', "Sorry, you can't have more than 3 folders.");
            res.redirect("/bookmarks");
        }
    }).catch(err =>{
        res.json(err);
    });
});

//Delete bookmark or folder
router.post("/delete", isLoggedIn, async (req, res) => {
    User.findOne({ user_id: req.user.user_id }, async (err, user) => {
        let folderId;
        if(user.content.dashboard.id(req.query.id) != null){
            user.content.dashboard.id(req.query.id).remove();
            folderId = "dashboard";
        }else if(user.content.folder.id(req.query.id) != null){
            user.content.folder.id(req.query.id).remove();
            folderId = "dashboard";  
        }else{
            user.content.folder.forEach(folder => {
                if(folder.content.id(req.query.id) != null){
                    folder.content.id(req.query.id).remove();
                    folderId = folder._id;
                }
            })
        }
        try{
            await user.save();
            if (folderId == "dashboard" || folderId == undefined) {
                res.redirect("/bookmarks");
            } else {
                res.redirect(`/user/${folderId}`);
            }
        } catch (err) {
            res.status(400);
        }
    }).catch(err => {
        res.json(err);
    });
});

//Update bookmark or folder
router.post("/update", isLoggedIn, async (req, res) => {
    User.findOne({ user_id: req.user.user_id }, async (err, user) => {
        let folderId;
        let goodNewId = false;
        if (user.content.dashboard.id(req.query.id) != undefined) {
            goodNewId = req.body.newFolder == "dashboard" || user.content.folder.id(req.body.newFolder) != undefined;
            folderId = "dashboard";
            if(goodNewId){
                if (req.body.newFolder == "dashboard") {
                    user.content.dashboard.id(req.query.id).set("notes", req.body.notes);
                    user.content.dashboard.id(req.query.id).set("meta.title", req.body.title);
                } else {
                    user.content.dashboard.id(req.query.id).set("meta.title", req.body.title);
                    user.content.folder.id(req.body.newFolder).content.push(new Bookmark({
                        url: user.content.dashboard.id(req.query.id).url,
                        notes: req.body.notes,
                        meta: user.content.dashboard.id(req.query.id).meta
                    }));
                    user.content.dashboard.id(req.query.id).remove();
                }
            } else {
                req.flash('message', "Invalid target folder");
            }
        } else if (user.content.folder.id(req.query.id) != undefined) {
            user.content.folder.id(req.query.id).set("name", req.body.name);
            folderId = "dashboard";
        } else {
            user.content.folder.forEach(folder => {
                if (folder.content.id(req.query.id) != undefined) {
                    goodNewId = req.body.newFolder == "dashboard" || user.content.folder.id(req.body.newFolder) != undefined;
                    folderId = folder._id;
                    if(goodNewId){
                        if(req.body.newFolder == "dashboard"){
                            folder.content.id(req.query.id).set("meta.title", req.body.title);
                            user.content.dashboard.push(new Bookmark({
                                url: folder.content.id(req.query.id).url,
                                notes: req.body.notes,
                                meta: folder.content.id(req.query.id).meta
                            }));
                            folder.content.id(req.query.id).remove();
                        }else if(req.body.newFolder == folder._id){
                            folder.content.id(req.query.id).set("notes", req.body.notes);
                            folder.content.id(req.query.id).set("meta.title", req.body.title);
                        }else{
                            folder.content.id(req.query.id).set("meta.title", req.body.title);
                            user.content.folder.id(req.body.newFolder).content.push(new Bookmark({
                                url: folder.content.id(req.query.id).url,
                                notes: req.body.notes,
                                meta: folder.content.id(req.query.id).meta
                            }));
                            folder.content.id(req.query.id).remove();
                        }
                    }else{
                        req.flash('message', "Invalid target folder");
                    }
                }
            });
        }
        await user.save();
        if (folderId == "dashboard" || folderId == undefined) {
            res.redirect("/bookmarks");
        } else {
            res.redirect(`/user/${folderId}`);
        }
    }).catch(err => {
        res.json(err);
    });
});


/* ==============  Image Viewer  ============= (/view/image/:image/:source?/:title?)
  Will be updated later with a more API to
  upload images, and store this data with the
  database, so comments can be added and other
  stuff.

  This will display an image hosted on another
  page. You can also pass a source url, and the
  title of image, or the title it came from.

  This is used by chrome extension so you can
  right click and save images. It will save
  the source site too.

  Must send all data using encodeURIComponent
*/
router.get( "/view/image/:image/:source?/:title?", ( req, res ) => {
  res.render( "image-view", { image: ( req.params && req.params.image ) ? decodeURIComponent( req.params.image ) : false, source: ( req.params && req.params.source ) ? decodeURIComponent( req.params.source ) : false, title: ( req.params && req.params.title ) ? decodeURIComponent( req.params.title ) : false });
});


/* ==============  URL REDIRECT  ============= (/redirect/:url/)
  This will redirect to the url request. Make
  sure to encodeURIComponent() to create the
  link. This will register an opened link with
  mixpanel.

  REQUIRES
    - mixpanel => tracking
    - url => for url parsing
*/
router.get( "/redirect/:url/", isLoggedIn, ( req, res ) => {
  mixpanel.track( "Entity Opened", {
      distinct_id: req.user.user_id,
      hypertext: req.params.url,
      host: url.parse( req.params.url ).hostname
  });
  res.redirect( decodeURIComponent( req.params.url ) );
});


/* ==============  USER PROFILE  ============= (/profile)
  This will display all the information that is
  grabbed from the APIv1.

  FIXME - This will later be updated so instead
  of rendering server side the client will make
  the api request and render on that side.

  REQUIRES
    - user to be logined
    - user method (APIv1 Local) => to get user info
*/
router.get( "/profile", isLoggedIn, ( req, res ) => {
  APIv1.user( req.user.user_id ).then( userData => {
    delete userData.identities;
    res.render( "profile", { user: userData } );
  }).catch( error => {
    // redirect to error page later
    res.json( error );
  });
});


/* ==============  DOCUMENT SERVER  ============= (/documentation)
  The documentation server is now served by express
  nothing else can use any sub-url of documentation
  to prevent problems with docsify. It servers
  the contents to /documentation and all the files
  located in ./doc to /static/documentation
*/
router.use( "/static/documentation/", express.static( "doc" ) );

router.get( "/documentation", ( req, res ) => {
  res.render( "../doc/index" );
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
