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
    const userName = req.session.nickname;
    
    return res.render("main.ejs", {idx, complexName, areas, B1, B2, userName});
} 

//barStatus =  `<a class="nav-link active" aria-current="page" href="/logout_check">로그아웃`; 


//controller를 두개 만들어서 로그인 부분이랑 본문 부분을 해야하나??

exports.login_check = async function(req, res,next){
    
    const select = req.params.select;
    const userID = req.body.id;
    const userPW = req.body.pw;
    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const userIndex = rows[1];

    if(userName.length>0){
        console.log("로그인 성공");
        req.session.nickname = userID;
        req.session.save(function(){    
            //next(); //next해서 하는 방법도 존재
            res.redirect(`/main/${select}`);
        });
    }else{
        console.log("로그인 실패");
        res.redirect(`/main/${select}`);
    }

}  

exports.logout_check = async function(req, res){
   
    const select = req.params.select;
    console.log("로그아웃 이거", select);
    req.session.destroy(function(){
        req.session;
    })
    res.redirect(`/main/${select}`);
}
