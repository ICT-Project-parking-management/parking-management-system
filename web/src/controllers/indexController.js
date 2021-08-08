const indexDao = require("../dao/indexDao");

exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    // Dynamo Example
    await indexDao.dynamoExample(1);
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    console.log('req.sesseion.nickname', req.session.nickname);
    const idx = req.params.idx;
    const rows = await indexDao.getComplexName(idx);
    const complexName = rows[0];
    const areas = rows[1];
    const B1 = rows[2];
    const B2 = rows[3];
    console.log(complexName, areas);

    return res.render("main.ejs", {complexName, areas, B1, B2});
} 

//barStatus =  `<a class="nav-link active" aria-current="page" href="/logout_check">로그아웃`; 
exports.login_check = async function(req, res){
  
    var nickname;
    const userID = req.body.id;
    const userPW = req.body.pw;
    const  isLogined = await indexDao.getUserList(userID, userPW);
    
    if(isLogined){
        console.log("로그인 성공");
        req.session.nickname = userID;
        nickname = req.session.nickname;
        req.session.save(function(){    
            //res.redirect('/main/1');                    
            res.render("login.ejs", {nickname}) //로그인이 됐으니까 이제 로그아웃이라 표시
        });
    }else{
        console.log("로그인 실패");
    }

}  

//controller를 두개 만들어서 로그인 부분이랑 본문 부분을 해야하나??