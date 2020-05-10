# DashBack API v1


## User Information
![Get Command](https://img.shields.io/badge/Get-/api/v1/user-grey?style=flat-square&labelColor=44C7F4)<br>
Grabbing user information, can be a good tool to check basic user information. If you are access from a client (web app), and they are not login you will get a response `active: false`. This indicates the user isn't login. All basic information for a users account is transmitted from this API Call. In the future this API call will also return information for settings, and premium account information.


<!-- tabs:start -->
#### **Response Attributes**
**user_id** <i>string</i> (optional) - ID of the user which can be used when interacting with other APIs.<br>
**email** <i>string</i> (optional) - Email address of this user.<br>
**email_verified** boolean (optional) - Whether this email address is verified (true) or unverified (false).<br>
**username** <i>string</i> (optional) - Username of this user.<br>
**phone_number** <i>string</i> (optional) - Phone number for this user when using SMS connections. Follows the E.164 recommendation.<br>
**phone_verified** <i>boolean</i> (optional) - Whether this phone number has been verified (true) or not (false).<br>
**created_at** <i>string</i> (optional) - Date and time when this user was created (ISO_8601 format).<br>
**updated_at** <i>string</i> (optional) - Date and time when this user was last updated/modified (ISO_8601 format).<br>
**picture** <i>string</i> (optional) - URL to picture, photo, or avatar of this user.<br>
**name** <i>string</i> (optional) - Name of this user.<br>
**nickname** <i>string</i> (optional) - Preferred nickname or alias of this user.<br>
**multifactor** <i>array[string]</i> (optional) - List of multi-factor authentication providers with which this user has enrolled.<br>
**last_ip** <i>string</i> (optional) - Last IP address from which this user logged in.<br>
**last_login** <i>string</i> (optional) - Last date and time this user logged in (ISO_8601 format).<br>
**logins_count** <i>integer</i> (optional) - Total number of logins this user has performed.<br>
**blocked** <i>boolean</i> (optional) - Whether this user was blocked by an administrator (true) or is not (false).<br>
**given_name** <i>string</i> (optional) - Given name/first name/forename of this user.<br>
**family_name** <i>string</i> (optional) - Family name/last name/surname of this user.<br>

#### **Response Example**
```json
{
  "user_id": "auth0|507f1f77bcf86cd799439020",
  "email": "john.doe@gmail.com",
  "email_verified": false,
  "username": "johndoe",
  "phone_number": "+199999999999999",
  "phone_verified": false,
  "created_at": "",
  "updated_at": "",
  "picture": "",
  "name": "",
  "nickname": "",
  "multifactor": [
    ""
  ],
  "last_ip": "",
  "last_login": "",
  "logins_count": 0,
  "blocked": false,
  "given_name": "",
  "family_name": ""
}
```

#### **NodeJS Request**
Only shows if your making the request from web app client side. Must be updated for machine to machine API Request.
```javascript
const request = ( "request" );

request( {
  method: "GET",
  url: "https://dashback.hype-industries/api/v1/user",
}, ( error, response, data ) => {
  if ( error ) console.log( error );
  console.log( data );
});
```
<!-- tabs:end -->
