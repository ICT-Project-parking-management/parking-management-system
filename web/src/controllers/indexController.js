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
    console.log(req.session.status);
    const parkingLotIdx = req.params.idx;
    // const status = req.session.status;
    const userName = req.session.nickname;
    
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

                    return res.render("main.ejs", {complexName, parkingLotInfo, parkingLotIdx, userName});
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
    const myCars = await indexDao.getMyCars(parkingLotIdx, userIndex); // RDS에서 내 차량번호 조회
    const myCarsArea = await indexDao.getMyAreas(myCars); // DynamoDB에서 내 차량 데이터 조회

    // TODO : 사용자의 차량이 어느 주차장 어느 구역에 주차되어 있는지 json 리턴
    //return res.json();
}

exports.lambda = async function (req, res) {
    const parkLocation = req.body.parkLocation;
    const createdTime = req.body.createdTime;
    const electric = req.body.electric;
    const carNum = req.body.carNum;
    const disabled = req.body.disabled;
    const inOut = req.body.inOut;
    const credit = req.body.creidt;
    const imgURL = req.body.imgURL;

    // credit 값이 threshold 미만인 경우 => flask 2차 검증 진행
    // credit 값이 threshold 이상인 경우 => dynamoDB 저장

    // if (credit < 0.5) {

    // } else {
    //     const [addToDynamo] = await indexDao.addToDynamo(parkLocation, createdTime, electric, carNum, disabled, inOut, credit, imgURL);
    // }

    return res.render("test.ejs");
}

exports.login_check = async function(req, res){
    const select = req.params.idx;

    const userID = req.body.username;
    const userPW = req.body.password;

    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const authPw = rows[1];
    const userIndex = rows[2];
    const status = rows[3];
    
    if(authPw.length>0){ //로그인 성공
        req.session.nickname = userID;
        if(status == 0 ){
            req.session.status = "admin";
        }else{
            req.session.status = "resident";
        }
        req.session.save(function(){
            const data = {"status": 200};
            res.send(data)

        });
    }else{ //로그인 실패
        let status = -1;
        if(userName.length>0) //비밀번호 틀림
            status = 201;
        else
            status = 202; //아이디 틀림
       
        const data = {status};
        res.send(data);
        
    }

}  

exports.logout_check = async function(req, res){
    const select = req.params.idx;
    req.session.destroy(function(){
        req.session;
    })
    res.send(`<script>location.href='/main/${select}';window.history.go(-1)</script>`);
}

const mailer = require("../../config/mailer");
exports.mail = async function(req, res){
    let emailParam = {
        subject: "[알림] 부정주차 차량",
        text:"얏호"
    }
    mailer.sendGmail(emailParam);
    res.status(200).send("성공");
}