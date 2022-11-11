const express = require('express');
const app = express();
require('dotenv').config();
const {auth, requiresAuth} = require('express-openid-connect');
const {Pool} = require('pg')
const https = require('https')
const fs = require('fs')

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))

const externalUrl = process.env.RENDER_EXTERNAL_URL;

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
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: '5432',
    ssl: true
})

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
})

app.get('/', (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        res.redirect('/login')
        return;
    }

    res.render('home.ejs', {
        loggedIn: req.oidc.isAuthenticated(),
        user: req.oidc.user,
        data: ""
    })
});

app.get('/userinfo', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user))
});

app.post('/getData', (req, res) => {
    code = req.body.code
    safe = req.body.safe

    if (safe == "on") {
        if (/^\d+$/.test(code)) {
            //dohvati podatke

            res.render('home.ejs', {
                loggedIn: req.oidc.isAuthenticated(),
                user: req.oidc.user,
                data: "SELECT * FROM Users WHERE secretCode = " + code
            })
        } else {
            res.render('home.ejs', {
                loggedIn: req.oidc.isAuthenticated(),
                user: req.oidc.user,
                data: "Molim unesite cijeli pozitivni broj"
            })
        }
    } else {
        res.render('home.ejs', {
            loggedIn: req.oidc.isAuthenticated(),
            user: req.oidc.user,
            data: "SELECT * FROM Users WHERE secretCode = " + code
        })
    }
    res.redirect('/')
})

app.get('/nesigurno', (req, res) => {
    name = req.query.name

    //dohvat podataka preko baze

    user = {
        id: 0,
        name: name,
        password: 123,
        secretCode: 111
    }
    res.render('info.ejs', {user: user})
})
app.get('/sigurno', requiresAuth(), (req, res) => {
    name = req.query.name

    if (name != req.oidc.user.name) {
        res.send("Nemate ovlasti vidjeti informacije ovog korsinika")
        return;
    }
    //dohvat podataka preko baze

    user = {
        id: 0,
        name: name,
        password: 123,
        secretCode: 111
    }
    res.render('info.ejs', {user: user})
})

const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}

if (externalUrl) {
    const hostname = '127.0.0.1'
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`);
    })
} else {
    https.createServer(options, app).listen(port, function () {
        console.log('Server running at https://localhost:' + port + '/')
    });
}
