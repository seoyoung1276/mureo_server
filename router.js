// const db = require('../db/config')

// const bcrypt = require('bycrpt')
// const SALT_ROUNDS = 10 

// //클라이언트에서 값을 받아오기 위한 코드
// Router.post('/register', (req, res,next) => {
//     const param = [req.body.id, req. body.pw, req.body.name]

//     bcrypt.hash(param[1], SALT_ROUNDS, (err, hash)=>{
//         param[1] = hash
//         db.qurey("INSERT INTO user(user_name,user_id,password,email) VALUES (?,?,?)", param, (err, row) =>{
//             if(err) console.log(err)
//         })
//     })
//     res.end() 
// })
