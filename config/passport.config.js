const Auth0Strategy = require("passport-auth0");
module.exports = passport => {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    passport.use(new Auth0Strategy(
        {
            domain: process.env.AUTH0_DOMAIN,
            clientID: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            callbackURL:
                process.env.AUTH0_CALLBACK_URL || "http://localhost:3000/callback"
        },
        function (accessToken, refreshToken, extraParams, profile, done) {
            /**
             * Access tokens are used to authorize users to an API
             * (resource server)
             * accessToken is the token to call the Auth0 API
             * or a secured third-party API
             * extraParams.id_token has the JSON Web Token
             * profile has all the information from the user
             */
            return done(null, profile);
        }
    ));
}