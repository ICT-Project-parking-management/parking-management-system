const indexDao = require("../dao/indexDao");

/**
 * update: 2021.08.08
 * author: serin
 * desc : 인덱스 페이지
 */
 exports.parkingData = async function (req, res) {
    // 등록된 주차장 리스트 조회
    const parkingLotList = await indexDao.getParkingList();
    return res.render("intro.ejs", {parkingLotList});
}

/**
 * update: 2021.08.08
 * author: heedong
 * desc : 메인 페이지
 */

 exports.main = async function (req, res) {
    const idx = req.params.idx;
    
    // 특정 주차장 정보 조회(주차장 이름, 주차 구역 리스트)
    // 데이터 포맷 : https://github.com/ICT-Project-parking-management/parking-management-system/wiki/%EB%8D%B0%EC%9D%B4%ED%84%B0-%ED%8F%AC%EB%A7%B7#main-%ED%8E%98%EC%9D%B4%EC%A7%80


    // 1. 주차장 이름 조회
    const [getComplexNameRows] = await indexDao.getComplexName(idx);
    const complexName = getComplexNameRows.complexName;
    const parkingLotInfo = [];

    // 2. 주차장 층 조회
    const floorRows = await indexDao.getFloors(idx);
    floorRows.forEach(async function (e1) {
        const floorName = e1.floor;

        // 3. 층별 주차면 정보 조회
        let areas = [];
        const AreaRows = await indexDao.getAreas(idx, floorName);
        AreaRows.forEach(async function (e2) {
            const areaName = e2.areaName;
            const areaInfo = e2.areaInfo;

            // TODO 4. Dynamo 조회해서 차량 번호 및 위반 여부 파악
            //const test = await indexDao.getCurrParkData(0, ['A1', 'A2']);

            const area = {areaName, areaInfo};
            areas.push(area);
        });

        const floor = {floorName, areas};
        parkingLotInfo.push(floor);

        const userName = req.session.nickname;

        // 리턴
        if (parkingLotInfo.length == floorRows.length) {
            //console.log(complexName);
            //console.log(parkingLotInfo);
            
            const test = await indexDao.getCurrParkData(idx, parkingLotInfo);
            const failed = req.session.failed;
            return res.render("main.ejs", {complexName, parkingLotInfo, idx, userName, failed});
        }
    })
}

exports.myArea = async function (req, res) {
    //const userIndex = req.verifiedToken.id;
    const idx = req.params.idx;
    const userIndex = 1; // 테스트용
    const rows = await indexDao.getMyArea(idx, userIndex);

    return res.render("main.ejs", {myArea})
}

exports.login_check = async function(req, res){
    const select = req.params.idx;
    const userID = req.body.id;
    const userPW = req.body.pw;
    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const userIndex = rows[1];
    if(userName.length>0){
        req.session.nickname = userID;
        req.session.failed="successLogin"
        req.session.save(function(){
            res.send(`<script>window.history.go(-1)</script>`)
        });
    }else{
        req.session.failed = "failedLogin";
        req.session.save(function(){
            res.send(`<script>window.history.go(-1)</script>`)
        });
    }

}  

exports.logout_check = async function(req, res){
   
    const select = req.params.idx;
    req.session.destroy(function(){
        req.session;
    })
    res.send(`<script>location.href='/main/${select}';window.history.go(-1)</script>`);
}
