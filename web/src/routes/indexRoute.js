const { response } = require("express");
const mysql = require("mysql");
require('dotenv').config();

module.exports = function(app) {
    const index = require("../controllers/indexController");
    
    const session  =require('express-session');
    const MySQLStore = require("express-mysql-session")(session);
    
    const bodyParser = require('body-parser');
   
    const options = {
        host: process.env.DB_HOST ,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PW ,
        database: process.env.DB_NAME 
    }

    const sessionStore = new MySQLStore(options);

    app.use(session({
        key: "session_cookie_name",
        secret: "session_cookie_secret", //key: "session_cookie_name"
        resave: false,
        saveUninitialized: true,
        store: sessionStore
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
        const userID = req.body.id;
        const userPW = req.body.pw;
        const connection = mysql.createConnection(options);
        
        req.session.is_logined = false;
        
        if(userID && userPW){
            connection.query(`SELECT userID, userPW FROM User WHERE userID = ? AND userPW = ?`,[userID, userPW], async function(error, results){
                if(error) throw error;
                if(results.length > 0){
                    req.session.is_logined=true;
                    req.session.nickname = req.body.id;
                    req.session.save(function(){
                        
                    res.redirect('/main/1');
                    });
                }else{
                    res.send(`<script>alert('로그인 실패');location.href='/main/1';</script>`);
                } 
            } ) 
        }else{
            res.send(`<script>alert('로그인 정보 미입력');location.href='/main/1';</script>`);
        }
    }, index.main);

}