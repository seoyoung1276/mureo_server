const db = require('../db/config')

//클라이언트에서 값을 받아오기 위한 코드
Router.post('/register', (req, res,next) => {
    const param = [req.body.id, req. body.pw, req.body.name]

    db.qurey('INSERT INTO user(`user_name`,`user_id`,`password`,`email`) VALUES (?,?,?)', param, (err, row) =>{
        if(err) console.log(err)
    })
    console.log(req.body)
    res.end() 
})
