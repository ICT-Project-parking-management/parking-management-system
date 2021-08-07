const { response } = require("express");
const indexDao = require("../dao/indexDao");

module.exports = function(app) {
    const index = require("../controllers/indexController");
    const session  =require('express-session');
    var FileStore = require('session-file-store')(session) //파일말고 db에 저장
    var bodyParser = require('body-parser');

    app.use(session({
        secret: 'asadlfkj!@#!@#dfgasdg',
        resave: false,
        saveUninitialized: true,
        store:new FileStore()
    })) //미들웨어
   
    app.use(bodyParser.urlencoded({extended:false}));

    app.get('/', index.parkingData);
    app.get('/main/:idx', index.main);
    app.get('/logout_check', function(req, res){
        req.session.is_logined = false;
        req.session.destroy(function(){
            req.session;
        })
        res.redirect('/main/1');
    }, index.main);

    app.post('/login_check', async function(req, res){ 
        const userList = await indexDao.getUserList();
        const userID = req.body.id;
        const userPW = req.body.pw;
        const [rows] = await userList.query(`SELECT userID, userPW FROM User;`);
        //const userQUERY = "SELECT userID, userPW"+ "FROM User WHERE userID = ? AND userPW = ?;";

        //let result = await userList.query(userQUERY);
        //console.log(result);
        req.session.is_logined = false;
        
        console.log(rows);
        for (var i=0; i<rows.length; i++){
            if(rows[i].userID === req.body.id && rows[i].userPW===req.body.pw){ //로그인 성공 시
                req.session.is_logined=true;
                req.session.nickname = req.body.id;
                req.session.save(function(){
                    res.redirect('/main/1');
                })
            }
        }
        
        if(req.session.is_logined===false){
            res.send(`<script>alert('로그인 실패');location.href='/main/1';</script>`);
        }
        
    }, index.main);

}