const express = require('express');
const app = express();
require('dotenv').config();
const { auth, requiresAuth } = require('express-openid-connect');

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

app.use(
    auth({
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        secret: process.env.SECRET,
        idpLogout: true,
        authRequired: false
    })
);

app.get('/', (req, res) => {
    let name = ""
    try {
        name = req.oidc.user.name
    } catch (e) {
        name = "Not logged in"
    }
    res.render('home.ejs', {
        loggedIn: req.oidc.isAuthenticated() ,
        name: name})
});

app.get('/userinfo', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user))
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Listening at port ' + port);
})
