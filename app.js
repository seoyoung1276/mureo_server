const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2');
const app = express();
// const session = require('express-session')
// const bcrypt = require('bcrypt');
// const SALT_ROUNDS = 10;  

app.use(bodyParser.json())
const port = 3000
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'mureo'
});

app.get('/', (req, res) => {
    res.send('hello');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})