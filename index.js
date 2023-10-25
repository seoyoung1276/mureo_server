//클라이언트에서 값을 받아오기 위한 코드
const bodyParser = require('express')

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))