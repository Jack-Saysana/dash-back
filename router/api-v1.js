/* DashBack Bookmark - API V1
 * Copyright (C) HYPE Industries Cloud Division - All Rights Reserved (HYPE-MMD)
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained from HYPE Industries.
 */

const request      = require( "request" );
var   auth0Token   = false;


// start token request for API
tokenRequest();
setInterval( tokenRequest, 8600000 );


class apiv1 {

  /* ==============  USER INFO  ============= (PUBLIC)
    Will return a promise with user information,
    based on the the Auth0 user ID.

    PARAMATERS
      - _id (STRING) => Auth0 user id

    REQUIRES
      - auth0Token => token to access Auth0
      - process.env.AUTH0_DOMAIN => auth0 domain

 */
  static user( _id ) {
    return new Promise( ( resolve, reject ) => {
      request( {
        method: "GET",
        url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/users/" + _id,
        headers: { authorization: "Bearer " + auth0Token }
      }, ( error, response, user ) => {
        if ( error ) reject( { error: error } );
        resolve( JSON.parse( user ) );
      });
    });
  }
}

// Request API Token for Machine to Machine API
function tokenRequest() {
  request( {
    method: "POST",
    url: "https://" + process.env.AUTH0_DOMAIN + "/oauth/token",
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    form: {
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_API_CLIENT_ID,
      client_secret: process.env.AUTH0_API_CLIENT_SECRET,
      audience: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/"
    }
  }, function (error, response, body) {
    if (error) throw new Error(error);
    auth0Token = JSON.parse( body ).access_token;
  });
}


module.exports = apiv1;
