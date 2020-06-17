# Change Log
**June 17th, 2020**
- better cards on mobile
- improved context menu for mobile
- margin on buttons in profile fixed for mobile
- title fixed on mobile

**June 5th, 2020**
- Right Click to open on Bookmark
- Chrome Extension is now available for download

**May 14th, 2020**
- changed env token from private API to main webapp for authentication
- mixpanel intagration
- added status codes for API
- integrated user feedback button
- added favicon to home page
- prevent error when requesting token

**May 13th, 2020**
- password reset request are now sent to `/api/v1/user/job/password-reset`

**May 12th, 2020**
- added API call to update name, request is private at `/api/v1/user/name`
- documentation server is now served by main server
- added redirect url for tracking

**May 11th, 2020**
- Added Error Message to Login callback
- profile page
- API for email update is made private `/api/v1/user/email`
- all erros with external API's are reflected with a `502` error

**May 10th, 2020**
- Added API call to grab user information `/api/v1/user`. Learn more in Developer Documentation.
- custom image viewer `/view/image/:imgURL/:sourceURL?/:title?`
