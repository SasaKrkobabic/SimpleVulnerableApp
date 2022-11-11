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
    user: process.env.DB_USER,
    host: process.env.DB_HOST_INTERNAL || process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
})

app.get('/', (req, res) => {
    // if (!req.oidc.isAuthenticated()) {
    //     res.redirect('/login')
    //     return;
    // }

    res.render('home.ejs', {
        loggedIn: req.oidc.isAuthenticated(),
        user: "",//req.oidc.user,
        data: [],
        message: ""
    })
});

app.get('/userinfo', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user))
});

app.post('/accounts', async (req, res) => {
    code = req.body.code
    safe = req.body.safe

    const data = []
    let result = await pool.query(`SELECT * FROM "Users" WHERE "secretCode" = ${code}`)
    console.log(result.rows)
    result.rows.forEach(r => {
        data.push({
            id: r["id"],
            username: r["username"],
            password: r["password"],
            secretCode: r["secretCode"]
        })
    })

    if (safe == "on") {
        if (/^\d+$/.test(code) && code.length > 0) {
            res.render('accounts.ejs', {
                data: data,
                code: code,
                message: ""
            })
        } else {
            res.render('accounts.ejs', {
                data: [],
                code: code,
                message: "Molim unesite cijeli pozitivni broj"
            })
        }
    } else {
        res.render('accounts.ejs', {
            data: data,
            code: code,
            message: ""
        })
    }
})

app.get('/nesigurno', async (req, res) => {
    name = req.query.name

    const data = []
    let result = await pool.query(`SELECT * FROM "Users" WHERE "username" = '${name}'`)
    console.log(result.rows)
    result.rows.forEach(r => {
        data.push({
            id: r["id"],
            username: r["username"],
            password: r["password"],
            secretCode: r["secretCode"]
        })
    })
    res.render('info.ejs', {data: data})
})
app.get('/sigurno', requiresAuth(), async (req, res) => {
    name = req.query.name

    if (name != req.oidc.user.name) {
        res.send("Nemate ovlasti vidjeti informacije ovog korsinika")
        return;
    }

    const data = []
    let result = await pool.query(`SELECT * FROM "Users" WHERE "username" = '${name}'`)
    console.log(result.rows)
    result.rows.forEach(r => {
        data.push({
            id: r["id"],
            username: r["username"],
            password: r["password"],
            secretCode: r["secretCode"]
        })
    })
    res.render('info.ejs', {data: data})
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening at port ${port}`)
})
