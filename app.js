<<<<<<< HEAD
// const express = require('express')
// const bodyParser = require('body-parser')
// const mysql = require('mysql2');
=======
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2');
const app = express();
>>>>>>> cec9cb0b5a3e41d4a023db4f10dd17dcf6503b95
// const session = require('express-session')
// const bcrypt = require('bcrypt');
// const SALT_ROUNDS = 10;  

// const app = express()
// app.use(session({
//     secret: 'secret',
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         maxAge: 60 * 60 * 1000
//     }
// }))

// app.use(bodyParser.json())
// const port = 3000
// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '1234',
//     database: 'mureo'
// });

app.get('/', (req, res) => {
    res.send('hello');
});



// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })