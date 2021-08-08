const { response } = require("express");
const session = require("express-session");
const mysql = require('mysql2/promise');
const indexDao = require("../dao/indexDao");
const { pool } = require("../../config/database");

module.exports = function(app) {
    const index = require("../controllers/indexController");
    
    app.get('/', index.parkingData);
    app.get('/main/:idx', index.main); //main뒤에 숫자가 오면 index.main을 실행시킬 거야.
    //main에 회원만 접근하게 하고 싶어하면 미들웨어주는데. 미들웨어 실행후 index.main이 실행됨.
    app.get('/logout_check', function(req, res){
        req.session.is_logined = false;
        req.session.destroy(function(){
            req.session;
        })
    
        res.redirect('/main/1');
        
    }); 

    app.post('/login_check', async function(req, res, next){  //회원가입이나 로그인을 하라고 페이지를 넘길 때 next를 활용을 해서.
       
       
        const userID = req.body.id;
        const userPW = req.body.pw;
        const  userList = await indexDao.getUserList(userID, userPW);
        //console.log(userList);
        req.session.is_logined = false;
        res.redirect('/main/1');
        
    });
}
