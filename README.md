## Setup
Install docsify `npm i docsify-cli -g` to run document server. To run the doc server run the command `npm run-script docServer`.

## Setup .env
```
AUTH0_DOMAIN=hype-industries.auth0.com
AUTH0_CLIENT_ID="auth0 client id"
AUTH0_CLIENT_SECRET=-"auth0 client secret"
AUTH0_API_CLIENT_ID="DashBack API"
AUTH0_API_CLIENT_SECRET="DashBack API"
SESSION_SECRET="session code"
```

## Fixme

## Features
Everything will slowly get moved to the API. Then instead of rendering on server side we can lazy load on client side. Have "single" page web app.
- add api command to update user
- add api command to preview url
- add api command to get auth0 login history
- add api command to get meta for bookmark
- add a way so user can generate API tokens to use API without being login. Also add a way for companies to create API request page.
