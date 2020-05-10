/* DashBack Bookmark - API V1
 * Copyright (C) HYPE Industries Cloud Division - All Rights Reserved (HYPE-MMD)
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained from HYPE Industries.
 */


const express        = require( "express" );
const router         = express.Router();
const APIv1          = require( "./api-v1.js" );


/* ==============  USER INFO  ============= (/api/v1/user)
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
    res.json( data );
  }).catch( error => {
    console.log(error);
    error.active = false;
    res.json( error );
  });
});


// checks for if user login and will later have API token
function authenticated(req, res, next){
    if ( req.isAuthenticated() )
        return next();
    res.json( { error: 401, message: "User is not login, or the token you have sent isn't valid" } );
}

module.exports = router;
