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



exports.login_check = async function(req, res){
    
    const select = req.params.idx;
    const userID = req.body.id;
    const userPW = req.body.pw;
    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const userIndex = rows[1];
    console.log(userIndex);
    if(userName.length>0){
        req.session.nickname = userID;
        req.session.save(function(){
            res.send(`<script>window.history.go(-1)</script>`)
            //res.redirect(`/main/${select}`);
        });

    }else{
        res.send(`<script>alert('로그인 실패');window.history.go(-1)</script>`);
    }

}  

exports.logout_check = async function(req, res){
   
    const select = req.params.idx;
    req.session.destroy(function(){
        req.session;
    })
    res.send(`<script>location.href='/main/${select}';window.history.go(-1)</script>`);
}
