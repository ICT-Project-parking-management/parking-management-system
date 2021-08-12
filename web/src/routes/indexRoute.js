module.exports = function(app) {
    const index = require("../controllers/indexController");
    app.get('/', index.parkingData);

    app.get('/main/:idx', index.main); //main에 회원만 접근하게 하고 싶어하면 미들웨어주는데. 미들웨어 실행후 index.main이 실행됨.
   
    app.post('/login_check/:select', index.login_check);
    app.get('/logout_check/:select', index.logout_check); //회원가입이나 로그인을 하라고 페이지를 넘길 때 next를 활용을 해서.

}
