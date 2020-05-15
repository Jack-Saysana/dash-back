/* DashBack Bookmark - API V1
 * Copyright (C) HYPE Industries Cloud Division - All Rights Reserved (HYPE-MMD)
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained from HYPE Industries.
 */


const express        = require( "express" );
const router         = express.Router();
const APIv1          = require( "./api-v1.js" );


/* ==============  USER INFO  ============= (/api/v1/user - read:email)
  Will return a json of all user information.
  This information comes from the user method
  from APIv1 and grabs it's info from the Auth0
  database. How ever connected identities are
  removed so the API doesn't have access to
  providers like google.
*/
router.get( "/user", authenticated, ( req, res ) => {
  APIv1.user( req.user.user_id ).then( data => {
    data.active = true;
    delete data.identities;
    res.status( data.status );
    res.json( data );
  }).catch( error => {
    console.log(error);
    error.active = false;
    res.status( error.status );
    res.json( error );
  });
});


/* ==============  CHANGE EMAIL  ============= (/api/v1/user/email - private)
  Private API call to update email. This will
  update the email with Auth0 and send email
  verification.
*/
router.post( "/user/email", authenticated, ( req, res ) => {
  APIv1.changeEmail( req.user.user_id, req.body.email ).then( data => {
    res.status( data.status );
    res.json( data );
  }).catch( error => {
    res.status( error.status );
    res.json( error );
  });
});


/* ==============  CHANGE NAME  ============= (/api/v1/user/name - private)
  Private API call to update name. This Will
  instantlly update the name in Auth0.
*/
router.post( "/user/name", authenticated, ( req, res ) => {
  APIv1.changeName( req.user.user_id, req.body.name ).then( data => {
    res.status( data.status );
    res.json( data );
  }).catch( error => {
    res.status( error.status );
    res.json( error );
  });
});


/* ============  PASSWORD RESET  =========== (/api/v1/user/name - private)
  Private API call for password reset. Will
  send email to user.
*/
router.post( "/user/job/password-reset", authenticated, ( req, res ) => {
  APIv1.requestNewPassword( req.user.user_id ).then( data => {
    res.status( data.status );
    res.json( data );
  }).catch( error => {
    res.status( error.status );
    res.json( error );
  });
});


// checks for if user login and will later have API token
function authenticated(req, res, next){
    if ( req.isAuthenticated() )
        return next();
    res.status( 401 );
    res.json( { status: 401, message: "User is not login, or the token you have sent isn't valid" } );
}

module.exports = router;
