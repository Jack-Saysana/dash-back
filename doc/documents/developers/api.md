# DashBack API v1
If the call has a method scope, like `read:user` then it means it can be accessed from a API token (in the future). If the method is labeled as private it can only be accessed from the client when they are logged in.

## User Information
![GET /api/v1/user](https://img.shields.io/badge/GET-/api/v1/user-grey?style=flat-square&labelColor=44C7F4)
![scope read:user](https://img.shields.io/badge/Scope-read:user-grey?style=flat-square&labelColor=yellow)<br>
Grabbing user information, can be a good tool to check basic user information. If you are access from a client (web app), and they are not login you will get a response `active: false`. This indicates the user isn't login. All basic information for a users account is transmitted from this API Call. In the future this API call will also return information for settings, and premium account information.


<!-- tabs:start -->
#### **AJAX Request**
This request can only be made from the client computer when they are login. This will be updated later for Machine to Machine API Requests.
```javascript
$.ajax({
  url: "https://dashback.hype-industries/api/v1/user",
  type: "get"
});
```

#### **Status Codes**
Please note general [status codes](/documents/developers/api?id=status-codes).

| Status Code | Meaning |
|---|---|
| `200` | The user information has been grab and returned successfully |


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



<!-- tabs:end -->

<br>

## Update Email
![POST /api/v1/user/email](https://img.shields.io/badge/POST-/api/v1/user/email-grey?style=flat-square&labelColor=01B48F)
![scope private](https://img.shields.io/badge/Scope-private-grey?style=flat-square&labelColor=yellow)<br>
Updating the email is only a private call, and therefor can only be done from the client. Updating the email will change the forwarding email address of the user. However, this is email is not yet verified. A verification email will be sent to the users new email. The user will not be able to access the account until this email has been verified, but there current session will continue. The email to change to will be sent as a body request attribute `email`.

<!-- tabs:start -->
#### **AJAX Request**
This request can only be made from the client computer when they are login.
```javascript
$.ajax({
  url: "https://dashback.hype-industries/api/v1/user/email",
  type: "post",
  dataType: 'json',
  data: { email: "email@example.com" }
});
```

#### **Status Codes**
Please note general [status codes](/documents/developers/api?id=status-codes).

| Status Code | Meaning |
|---|---|
| `202` | The email has successfully been changed and email confirmation is on it's way |
| `400` | The email you have sent is not a valid email address format |

<!-- tabs:end -->


<br>


## Status Codes
Status codes are returned with all API request. How ever messages may not always come with the response. The status information is structured as `{ status: 200, message: "Message" }`, with the status code being an integer, and the message being a string. Please note a message does NOT mean there was an error. These are just the general status codes. There is more information in each request API for what each status code means specifically.

| Status Code | Meaning |
|---|---|
| `200` – `299` | The request has been successfully completed |
| `401` | User is not authenticated. |
| `502` | We have had an error with an external part to our system. Please contact us. |
