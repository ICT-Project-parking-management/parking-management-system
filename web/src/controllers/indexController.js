const indexDao = require("../dao/indexDao");

exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    // Dynamo Example
    await indexDao.dynamoExample(1);
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    
    const idx = req.params.idx;
    const rows = await indexDao.getComplexName(idx);
    const complexName = rows[0];
    const areas = rows[1];
    const B1 = rows[2];
    const B2 = rows[3];
    console.log(complexName, areas);

    var isLogined;
    var nickname;
    var barStatus;
    if (req.session.is_logined){ //로그인 성공 시
        isLogined = `로그아웃`;
        nickname = '안녕하세요 '+ req.session.nickname +'님 |';
        barStatus =  `<a class="nav-link active" aria-current="page" href="/logout_check">
        로그아웃`; 
       
    }
    else{ //로그인 실패 시
       
        isLogined =  "로그인";
        nickname = '';
        barStatus = `<a class="nav-link active" aria-current="page" href="javascript:openModal('login-modal');">
        로그인`; 
    }
    return res.render("main.ejs", {complexName, areas, B1, B2, isLogined, nickname, barStatus});
}