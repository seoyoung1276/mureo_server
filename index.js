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
    db.query('SELECT * FROM interest WHERE user_no = ? ORDER BY start_date DESC', 
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
    const param = [req.body.title, req.body.content, req.body.date, req.body.interest_no]
    db.query('insert into post(title, content, date, interest_no) values (?,?,?,?)',
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

// 관심사 pk로 관심사 조회
app.get('/interest/:interest_no/info', (req, res) => {
    const interestNo = req.params.interest_no;
    db.query(
        'select * from interest where interest_no = ?',
        [interestNo],
        (err, result) => {
            if (err) {
                res.status(404).json({result : err})
            } else {
                res.json(result[0]);
            }
        }
    )
}) ;

// 관심사 그만 좋아하기
app.patch('/stop/:interestno', (req, res)=>{
    const param = [req.params.interestno, req.body.end_date]
    db.query('UPDATE interest set end_date = ? WHERE interest_no = ?', 
    param,
    (err, rows, result)=>{
        if(err){
            res.json({ reuslt : err})
        } else {
            res.json({ result : "ok"})
        }
    })
})


// 유저 검색
app.get('/users/search/:username',(req, res)=>{
    const userName = req.params.username
    const searchPattern = '%' + userName + '%';
    db.query('SELECT * from user WHERE user_id like ?',
    [searchPattern],
     (err, rows, result)=>{
        if(err){
            res.json({err})
        }else{
            if (result.length > 0) {
                res.json({result : rows})
            } else {
                res.json({ message: "해당하는 사용자가 없습니다." })
            }
        }
    })
})

// 팔로우 하기 
app.post('/users/follow',(req, res)=>{
    const params = [req.body.follower_id, req.body.following_id]
    db.query('INSERT INTO follow (follower_id, following_id) VALUES (?,?)',
    params,
     (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({ result : err })
        } else {
            res.status(201).json({result: "팔로우 성공"})
        }
    })
})

// 팔로우 취소
app.delete('/users/unfollow', (req, res) => {
    const params = [req.body.follower_id, req.body.following_id]
    db.query('DELETE FROM follow WHERE follower_id = ? AND following_id = ?',
        params,
        (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ result: err });
            } else {
                res.status(200).json({ result: "팔로우 취소 완료" })
            }
        }
    );
});


// 팔로워 목록 조회
app.get('/followers/:userno', (req, res) => {
    const userno = req.params.userno;
    db.query('SELECT u.* FROM user AS u INNER JOIN follow AS f ON u.user_no = f.follower_id WHERE f.following_id = ?',
    [userno], 
    (err, result) => {
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
    db.query('SELECT u.* FROM user AS u INNER JOIN follow AS f ON u.user_no = f.following_id WHERE f.follower_id = ?', 
    [userno], 
    (err, result) => {
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

// 팔로잉 여부
app.post('/isFollowing', (req, res) => {
    const params = [req.body.follower_id, req.body.following_id]
    db.query('select * from follow where follower_id = ? and following_id = ?',
    params,
    (err, result) => {
        if(err) {
            res.status(500).json({result : err})
        } else {
            if(result.length > 0){
                res.status(200).json({ result : true})
            } else {
                res.status(200).json({ result : false})
            }
        }
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
