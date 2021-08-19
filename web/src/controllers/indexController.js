
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
    const parkingLotIdx = req.params.idx;
    // const status = req.session.status;
    const userName = req.session.nickname;
    const failed = req.session.failed;

    /* 210817 - 로그인 되었을 시 사용자 차량 주차 위치 확인 */
    const userIndex = 1; // 테스트용
    const myArea = await indexDao.getMyArea(parkingLotIdx, userIndex);

    // 특정 주차장 정보 조회(주차장 이름, 주차 구역 리스트)
    // 데이터 포맷 : https://github.com/ICT-Project-parking-management/parking-management-system/wiki/%EB%8D%B0%EC%9D%B4%ED%84%B0-%ED%8F%AC%EB%A7%B7#main-%ED%8E%98%EC%9D%B4%EC%A7%80

    // 1. 주차장 이름 조회
    const [getComplexNameRows] = await indexDao.getComplexName(parkingLotIdx);
    const complexName = getComplexNameRows.complexName;
    const parkingLotInfo = [];
    // 2. 주차장 층 조회
    const floorRows = await indexDao.getFloors(parkingLotIdx);
    floorRows.forEach(async function (e1) {
        const floorName = e1.floor;

        // 3. 층별 주차면 정보 조회
        let areas = [];
        const AreaRows = await indexDao.getAreas(parkingLotIdx, floorName);
        AreaRows.forEach(async function (e2) {
            const areaName = e2.areaName;
            const areaInfo = e2.areaInfo;

            // 4. Dynamo 조회해서 구역에 대한 차량 번호 및 위반 여부 파악
            const areaNumber = parkingLotIdx + '-' + floorName + areaName;
            const areaStatus = await indexDao.getCurrParkData(areaNumber);

            if (areaStatus.length != 0) {
                const isBlocked = areaStatus[0].inOut == "in" ? true : false;
                const carNum = areaStatus[0].carNum || null;
                const electric = areaStatus[0].electric || null;
                const disabled = areaStatus[0].disabled || null;

                const carStatus = electric ? (disabled ? 3 : 2) : (disabled ? 1 : 0);
                let warning = areaInfo == carStatus ? false : true;
                if (carStatus == 3) warning = false;

                if (isBlocked) {
                    const area = {areaName, isBlocked, carNum, areaInfo, warning};
                    areas.push(area);
                } else {
                    const area = {areaName, isBlocked, areaInfo, warning};
                    areas.push(area);
                }
            } else {
                let isBlocked = false;
                let warning = false;
                
                const area = {areaName, isBlocked, areaInfo, warning};
                areas.push(area);
            }

            // Todo 세션 처리됐을 경우
            // if (status === "admin") {
            //     const area = {areaName, isBlocked, carNum, areaInfo, warning};
            //     areas.push(area);
            // } else {
            //     const area = {areaName, isBlocked, areaInfo, warning};
            //     areas.push(area);
            // }

            // 리턴
            if (areas.length == AreaRows.length) {
                const floor = {floorName, areas};
                parkingLotInfo.push(floor);

                if (parkingLotInfo.length == floorRows.length) {
                    //return res.json(parkingLotInfo);

                    // 층 순서 정렬
                    parkingLotInfo.sort((a, b) => {
                        return (a.floorName < b.floorName) ? -1 : (a.floorName > b.floorName) ? 1 : 0;
                    })
                    // 구역 순서 정렬
                    parkingLotInfo.forEach((e) => {
                        e.areas.sort((a, b) => {
                            return (a.areaName < b.areaName) ? -1 : (a.areaName > b.areaName) ? 1 : 0;
                        })
                    })
                    return res.render("main.ejs", {complexName, parkingLotInfo, parkingLotIdx, failed, userName});
                }
            }
        });
    })
}

        

exports.myArea = async function (req, res) {
    //const userIndex = req.verifiedToken.id;
    const parkingLotIdx = req.params.idx;
    const userIndex = 1; // 테스트용

    const [getComplexNameRows] = await indexDao.getComplexName(parkingLotIdx);
    const complexName = getComplexNameRows.complexName;
    const myArea = await indexDao.getMyArea(parkingLotIdx, userIndex);

    console.log('myArea >>', myArea);

    return res.render("main.ejs", {complexName, myArea})
}
exports.lambda = async function (req, res) {
    //const jsonName = req.body.jsonName;
    //const imgURL = req.body.imgURL;

    console.log('req >>', req);
    console.log('req.body.jsonName >>', req.body.jsonName);

    return res.render("test.ejs");
}

exports.login_check = async function(req, res){
    const select = req.params.idx;
    const userID = req.body.id;
    const userPW = req.body.pw;
    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const authPw = rows[1];
    const userIndex = rows[2];

    if(authPw.length>0){ //로그인 성공
        req.session.nickname = userID;
        req.session.failed="successLogin"
        req.session.save(function(){
            res.send(`<script>window.history.go(-1)</script>`)
        });
    }else{ //로그인 실패
        if(userName.length>0){
            req.session.failed = "failedPw";
        }
        else{
            req.session.failed = "failedId";
        }
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
