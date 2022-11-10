const express = require('express');
const app = express();
require('dotenv').config();
const {auth, requiresAuth} = require('express-openid-connect');
const {Pool} = require('pg')

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))

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

const pool = new Pool({
    user: 'admin',
    host: 'n6LV5PMLDqm1p8C3tMr7ZsB43P8pldPk@dpg-cdltu1kgqg4eum1e1akg-a.frankfurt-postgres.render.com',
    database: 'web2lab2database',
    password: 'n6LV5PMLDqm1p8C3tMr7ZsB43P8pldPk',
    port: '5432',
    ssl: true
})

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
})

app.get('/', (req, res) => {
    let name = ""
    try {
        name = req.oidc.user.name
    } catch (e) {
        name = "Not logged in"
    }
    res.render('home.ejs', {
        loggedIn: req.oidc.isAuthenticated(),
        name: name
    })
});

app.get('/userinfo', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user))
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Listening at port ' + port);
})
