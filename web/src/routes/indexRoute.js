module.exports = function(app) {
    const index = require("../controllers/indexController");

    // 주차장 선택
    app.get('/', index.parkingData);

    // 세부 주차장 정보 확인
    app.get('/main/:idx', index.main);

    // 내 주차구역 확인
    app.get('/main/:idx/myArea', index.myArea);

    // lambda
    app.post('/lambda', index.lambda)

    //로그인
    app.post('/login_check', index.login_check);

    //로그아웃
    app.get('/logout_check/:idx', index.logout_check);

    //메일
    app.get('/mail', index.mail);
}