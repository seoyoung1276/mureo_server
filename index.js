//클라이언트에서 값을 받아오기 위한 코드
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session') 
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10 

const port = 3000; 
const app = express()

app.use(bodyParser.json())
app.use(session({
    secret: 'secret',
    resave: false,  // 매 req마다 세션을 계속 다시 저장하는 옵션? 
    saveUninitialized: true,  
    cookie: {
        maxAge : 1000 * 60 * 60  //쿠키 유효시간 1시간 
    }
}))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'mureo'
});

const loginRequired = function(req, res, next) {
    if(req.session.user) {
        next()
    } else {
        res.status(401).json({ result: "현재 로그인 상태가 아닙니다."})
    }
}

// 회원가입 - 이메일 유효성 체크랑 아이디 중복 검사는 없음 
app.post("/register", (req, res) => {
    console.log(req.body)
    const param = [req.body.user_name, req.body.user_id, req.body.password, req.body.email]
    // 해시 함수
    bcrypt.hash(param[2], SALT_ROUNDS, function(err, hash){
        param[2] = hash 
        db.query("INSERT INTO user(user_name, user_id, password, email) VALUES (?,?,?,?)",
        param,
        function(err, rows, fields){
            if(err) {
                res.json({result : err})
            } else {
                res.json({result : "ok"})
            }
        })
    })
    
})

// 로그인 
app.post("/login", (req, res) =>{
    const {user_id, password} = req.body
    console.log(user_id)
    console.log(password)
    db.query("select * from user where user_id = ?",
    [user_id],
    function(err, rows, fields){
        if(rows.length === 0){
            res.status(404).json({ reuslt: "존재하지 않는 사용자입니다." })
        }else{
           const user = rows[0]
           bcrypt.compare(password, rows[0].password, function(err, result){           
            if(result) {
                req.session.user = {
                    user_id: user.user_id,
                    user_name: user.user_name,
                }
                req.session.save();
                res.json({ result : "로그인 성공"})
           }else{
            res.json({ result : "로그인 실패 (비번 틀림)"})
           }
        })
        
        }
    })
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
