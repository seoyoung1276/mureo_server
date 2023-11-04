//클라이언트에서 값을 받아오기 위한 코드
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session') 
const maria = require('mysql')
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10 
const corsMiddleware = require('./middlewares/cors');

const port = 3000; 
const app = express()

app.use(corsMiddleware);

app.use(bodyParser.json())
app.use(session({
    secret: 'secret',
    resave: false,  // 매 req마다 세션을 계속 다시 저장하는 옵션? 
    saveUninitialized: true,  
    cookie: {
        maxAge : 1000 * 60 * 60  //쿠키 유효시간 1시간 
    }
}))

const db = maria.createConnection({
    host: 'svc.sel5.cloudtype.app',
    user: 'root',
    port: 31502,
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
            res.status(404).json({ reuslt: "존재하지 않는 사용자입니다." }) // 아이디 틀렸을 때
        }else{
           const user = rows[0]
           bcrypt.compare(password, rows[0].password, function(err, result){           
            if(result) {
                req.session.user = {
                    user_no: user.user_no,
                    user_name: user.user_name,
                }
                req.session.save();  // 세션에 저장
                res.json({ result : "로그인 성공",
                            user_no: user.user_no})
           }else{
            res.json({ result : "로그인 실패 (비번 틀림)"}) // 비밀번호 틀렸을 때
           }
        })
        
        }
    })
})

// 유저 정보 조회
app.get('/users/:userno', (req, res) => {
    const userNo = req.params.userno;
    db.query(
        'SELECT * FROM user WHERE user_no = ?',
        [userNo],
        (err, result) => {
            if (err) {
                res.json({result : err})
            } else {
                res.json(result);
            }
        });
});

//카테고리 만들기
app.post('/interest', (req, res) => {
    const param = [req.body.user_no, req.body.interest_name, req.body.start_date, req.body.end_date, req.body.reason, req.body.color]
    db.query('insert into interest(user_no, interest_name, start_date, end_date, reason, color) values (?,?,?,?,?,?)',
    param, 
    (err, rows, fields) => {
        if(err) {
            res.json({result : err})
        } else {
            res.json({result : "ok"})
        }
    })
})

// 유저 아이디로 카테고리 조회하기
app.get('/interest/:userno', (req, res) => {
    const userNo = req.params.userno;
    db.query('SELECT * FROM interest WHERE user_no = ?', 
    [userNo],
    (err, result) => {
        if (err) {
            res.json({result : err})
        } else {
            res.json(result);
        }
    });
})

// 카테고리에 글 작성
app.post('/interest/post', (req, res) => {
    const param = [req.body.title, req.body.content, req.body.interest_no]
    db.query('insert into post(title, content, interest_no) values (?,?,?)',
    param,
    (err, rows, fields) =>{
        if (err){
            res.json({result : err})
        } else {
            res.json({result : "ok"})
        }
    })
})

// 카테고리 아이디로 모든 글 조회
app.get('/interest/post/:interestno', (req, res) => {
    const interestNO = req.params.interestno
    db.query('select * from post where interest_no = ?',
    [interestNO],
    (err, rows, result) =>{
        if(err){
            res.json({result : err})
        }else{
            res.json({result : rows})
        }
    })
})

// 유저 검색
app.get('/users/search',(req, res)=>{

})

// 팔로우 하기 
app.post('/users/follow',(req, res)=>{
    const { follower_id, following_id } = req.body
    const query = `INSERT INTO follow (follower_id, following_id) VALUES (${follower_id}, ${following_id})`
    db.query(query, (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({ result : err })
        } else {
            res.status(201).json({result: "ok"})
        }
    })
})


// 팔로워 목록 조회
app.get('/followers/:userno', (req, res) => {
    const userno = req.params.userno;
    const query = `SELECT u.* FROM user AS u 
                   INNER JOIN follow AS f ON u.user_no = f.follower_id
                   WHERE f.following_id = ${userno}`
    db.query(query, (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).json({ result: err })
      } else {
        if (result.length > 0) {
          res.status(200).json(result)
        } else {
          res.status(404).json({ message: "팔로워 없음" })
        }
      }
    })
  })
  
// 팔로잉 목록 조회
app.get('/followings/:userno', (req, res) => {
    const userno = req.params.userno
    const query = `SELECT u.* FROM user AS u 
                   INNER JOIN follow AS f ON u.user_no = f.following_id
                   WHERE f.follower_id = ${userno}`
    db.query(query, (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).json({ result: err })
      } else {
        if (result.length > 0) {
          res.status(200).json(result)
        } else {
          res.status(404).json({ message: "팔로잉 없음" })
        }
      }
    })
  })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
