module.exports = function(app) {
    const index = require("../controllers/indexController");

    // 주차장 선택
    app.get('/', index.parkingData);

    // 세부 주차장 정보 확인
    app.get('/main/:idx', index.main);

    // 내 주차구역 확인
    app.get('/main/:idx/myArea', index.myArea);

    // 관리자 - 데이터 마이닝
    app.get('/analyze', index.getPossession);

    // 방문자 - 예정 주차 시간 페이지
    app.get('/visitor', index.visitor);

    // 방문자 - 주차 구역 추천
    app.get('/recommend', index.recommend);

    // 거주자 - 선호 주차 구역
    app.get('/resident', index.resident);

    // violation
    app.post('/violation', index.violation)

    // violation 관리자 확인
    app.post('/readToViolation', index.readToViolation);

    // 부정주차기록 관리자 확인
    app.post('/doneToViolation', index.doneToViolation);

    // 전체 violation 기록
    app.get('/all-violation', index.allViolation);

    // 로그인
    app.post('/login', index.loginCheck);

    //로그아웃
    app.post('/logout', index.logoutCheck);
}