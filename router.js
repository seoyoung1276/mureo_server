//클라이언트에서 값을 받아오기 위한 코드
Router.post('/register', (req, res,next => {
    console.log(req.body)
    res.end() 
}))
