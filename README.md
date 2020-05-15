## Setup
docsify documentation server now runs automatically and served by express

## Setup .env
```
AUTH0_DOMAIN=hype-industries.auth0.com
AUTH0_CLIENT_ID="auth0 client id"
AUTH0_CLIENT_SECRET="auth0 client secret"
SESSION_SECRET="session code"
```

## Fixme
- fix propduction mode session memory leak (redis)
- better error page for login callback
- 404 page
- report 502 errors to logger service
- add API max requests
- add google analitics to doc server

## Features
Everything will slowly get moved to the API. Then instead of rendering on server side we can lazy load on client side. Have "single" page web app.
- add api command to preview url
- add api command to get auth0 login history
- add api command to get meta for bookmark
- add a way so user can generate API tokens to use API without being login. Also add a way for companies to create API request page.
