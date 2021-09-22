module.exports = function(app) {
    const index = require("../controllers/indexController");

    // 주차장 선택
    app.get('/', index.parkingData);

    // 세부 주차장 정보 확인
    app.get('/main/:idx', index.main);

    // 내 주차구역 확인
    app.get('/main/:idx/myArea', index.myArea);

    // 데이터 마이닝
    app.get('/analyze', index.analyze);

    // violation
    app.post('/violation', index.violation);

    // violation 관리자 확인
    app.post('/readToViolation', index.readToViolation);

    // 전체 violation 기록
    app.get('/all-violation', index.allViolation);

    //로그인
    app.post('/loginCheck', index.loginCheck);

    //로그아웃
    app.get('/logoutCheck/:idx', index.logoutCheck);
}