/* DashBack Bookmark - API V1
 * Copyright (C) HYPE Industries Cloud Division - All Rights Reserved (HYPE-MMD)
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained from HYPE Industries.
 */

const request      = require( "request" );
const mongoose     = require( "mongoose" );
const database     = require( "../models/user.model.js" );

var   auth0Token   = false;


/*{
  folder: [ {id,name} ]
  content: [ {id, folderID} ]
}*/



// test
// database.collection( "users", function (err, collection) {
//    collection.find().then( data => {
//      console.log(data)
//    }).catch( error => {
//      console.log( error );
//    } )
// });

// database.Schema.findOne( { user_id: "auth0|5e988afd3ba81d0c5d9946d8"  } ).then( data => {
//
//   data.content.dashback.id( "werwer" ).meta.node = ;
//
//   data.content.dashboard.forEach( (item, i) => {
//     if ( item.id == "werewr" ) {
//       item.meta.note = newNote;
//     }
//     exit;
//   });
//
//   data.save();
//
//
//   data.content.dashboard.push( new database.contentScheme( { url: "https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash" } ) );
//   // data.save();
// }).catch( error => {
//   console.log( error )
// });


// start token request for API
tokenRequest();
setInterval( tokenRequest, 8600000 );


class apiv1 {

  /* ===============  USER INFO  =============== (PUBLIC)
    Will return a promise with user information,
    based on the the Auth0 user ID.

    STATUS CODE:
      200 - successfull
      502 - Auth0 Error

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
      }, ( error, response, data ) => {
        if ( error ) reject( { status: 502, message: "Error: " + error } );
        data = JSON.parse( data )
        if ( !data.statusCode && !data.message ) {
          data.status = 200;
          resolve( data );
        } else {
          reject( { status: 502, message: "Error: Auth0 (" + data.statusCode + ") " + data.message } );
        }
      });
    });
  }


  /* ==============  CHANGE EMAIL  ============= (PRIVATE)
    This will contact Auth0 update the email and
    also make the email non-verified. After that
    is successfull will request an email to be sent
    to confirm the email.

    STATUS CODE:
      400 - Email Not valid format
      202 - successfull
      502 - Auth0 Error

    PARAMATERS
      - _id (STRING) => Auth0 user id
      - newEmail (STRING) => set new email

    REQUIRES
      - auth0Token => token to access Auth0
      - process.env.AUTH0_DOMAIN => auth0 domain

 */
  static changeEmail( _id, newEmail ) {
    return new Promise( ( resolve, reject ) => {
      if ( !validateEmail( newEmail ) ) {
        reject( { status: 400, message: "Error: Not a valid email format." } );
      }
      request( {
        method: "PATCH",
        url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/users/" + _id,
        headers: { authorization: "Bearer " + auth0Token },
        body: { email: newEmail, email_verified: false },
        json: true
      }, ( error, response, data ) => {
        if ( error ) reject( { status: 502, message: "Error: " + error } );
        if ( !data.statusCode && !data.message ) {
          request( {
            method: "POST",
            url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/jobs/verification-email",
            headers: { authorization: "Bearer " + auth0Token },
            body: { user_id: _id },
            json: true
          }, ( error, response, data ) => {
            if ( error ) reject( { status: 502, message: "Error: " + error } );
            if ( !data.statusCode && !data.message ) {
              resolve( { status: 202, message: "Success: Email successfully update. Awaiting verification." } );
            } else {
              reject( { status: 502, message: "Error: Auth0 (" + data.statusCode + ") " + data.message } );
            }
          });
        } else {
          reject( { status: 502, message: "Error: Auth0 (" + data.statusCode + ") " + data.message } );
        }
      });
    });
  }


  /* ==============  CHANGE NAME  ============== (PRIVATE)
    This will contact Auth0 update the name.
    This request can only be made from client.

    STATUS CODE:
      400 - No name provided
      200 - successfull
      502 - Auth0 Error

    PARAMATERS
      - _id (STRING) => Auth0 user id
      - name (STRING) => set new name

    REQUIRES
      - auth0Token => token to access Auth0
      - process.env.AUTH0_DOMAIN => auth0 domain

 */
  static changeName( _id, name ) {
    return new Promise( ( resolve, reject ) => {
      if ( name == "" ) {
        reject( { status: 400, message: "Error: No data was sent" } );
      }
      request( {
        method: "PATCH",
        url: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/users/" + _id,
        headers: { authorization: "Bearer " + auth0Token },
        body: { name: name },
        json: true
      }, ( error, response, data ) => {
        if ( error ) reject( { status: 502, message: "Error: " + error } );
        if ( !data.statusCode && !data.message ) {
          resolve( { status: 200, message: "Success: Name updated." } );
        } else {
          reject( { status: 502, message: "Error: Auth0 (" + data.statusCode + ") " + data.message } );
        }
      });
    });
  }


  /* =============  PASSWORD RESET  ============ (PRIVATE)
    Will check with Auth0 to get the users email,
    then create a database request to send an
    email for a password reset.

    STATUS CODE:
      202 - successfull
      502 - Auth0 Error

    PARAMATERS
      - _id (STRING) => Auth0 user id

    REQUIRES
      - auth0Token => token to access Auth0
      - process.env.AUTH0_DOMAIN => auth0 domain
      - this.user (APIv1) => to get users email
 */
  static requestNewPassword( _id ) {
    return new Promise( ( resolve, reject ) => {
      this.user( _id ).then( user => {
        request( {
          method: "POST",
          url: "https://" + process.env.AUTH0_DOMAIN + "/dbconnections/change_password",
          body: { client_id: process.env.AUTH0_CLIENT_ID, email: user.email, connection: 'Username-Password-Authentication' },
          json: true
        }, ( error, response, data ) => {
          if ( error ) reject( { status: 502, message: "Error: " + error } );
          if ( !data.statusCode && !data.message ) {
            resolve( { status: 202, message: "Success: We've just sent you an email to reset your password. You have 24 hours.", email: user.email } );
          } else {
            reject( { status: 502, message: "Error: Auth0 (" + data.statusCode + ") " + data.message } );
          }
        });
      }).catch( error => {
        reject( error );
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
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: "https://" + process.env.AUTH0_DOMAIN + "/api/v2/"
    }
  }, function (error, response, body) {
    if (error) {
      console.log( error );
      tokenRequest();
    } else {
      auth0Token = JSON.parse( body ).access_token;
    }
  });
}


// validates if email address is propper format
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = apiv1;
