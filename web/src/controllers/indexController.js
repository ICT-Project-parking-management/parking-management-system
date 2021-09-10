const indexDao = require("../dao/indexDao");
const mailer = require("../../config/mailer");
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
    console.log('req.session.status >>', req.session.status);
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
                    
                    //부정주차차량 RDS 조회
                    const [readToUndone] = await indexDao.readToUndone();
                    var objLength = Object.keys(readToUndone).length;
                    var banData= [];
                    for(var i=0; i< objLength; i++){
                        banData[i] = JSON.parse(JSON.stringify(readToUndone))[i];
                    }
        
                    return res.render("main.ejs", {complexName, parkingLotInfo, parkingLotIdx, userName, banData});
                }
            }
        });
    })
}

exports.myArea = async function (req, res) {
    const parkingLotIdx = req.params.idx;
    const userName = req.session.nickname;
    const getUserIndex = await indexDao.getUserIndex(userName);
    const userIndex = getUserIndex[0].userIndex;

    const [getComplexNameRows] = await indexDao.getComplexName(parkingLotIdx);
    const complexName = getComplexNameRows.complexName;

    // RDS에서 내 차량번호 조회
    const myCars = await indexDao.getMyCars(parkingLotIdx, userIndex);
    let areas = [];

    // DynamoDB에서 내 차량 주차위치 조회
    myCars.forEach(async function(e) {
        const carNum = e.cars;
        const info = await indexDao.getMyAreas(carNum);
        
        if (info.length !=0 && info[0].inOut == "in") {
            let area = {
                carNum,
                'areaName': info[0].areaNumber
            };
            areas.push(area);
        } else {
            let area = {
                carNum,
                'areaName': 'none'
            };
            areas.push(area);
        }

        if (areas.length == myCars.length) {
            return res.send(areas);
        }
    });
    
}


exports.lambda = async function (req, res) {
    const info = req.body.info;
    const data = JSON.parse(JSON.stringify(req.body.data))[0];
    const parkingLotIdx = info.parkingLotIndex;
    const section = info.section;
    const type = info.type;
    const imgUrl = info.imgURL;
    const createdAt = info.createdAt;
    const location = data.location;
    const inOut = data.inOut;
    const carNum = data.carNum;
    const electric = data.electric;
    const disabled = data.disabled;
    
    //RDS에 조회해서 부정주차 확인
    const [rows] = await indexDao.getSpecificAreaInfo(parkingLotIdx, section, location);
    const areaInfo = rows.areaInfo; //일반 0 장애인 1 전기 2
    if (inOut === "in") {
        if (disabled === 0 && areaInfo === 1) {//비 장애인 차량이 장애인 전용에 주차
            console.log('위반 (장애인차량 전용 구역에 주차)'); //B2B1
        }else if(electric ===0 && areaInfo ===2){ //비 전기차량이 전기차 전용에 주차
            console.log('위반 (전기차 전용 구역에 주차)'); //B1A1
        }
        console.log(parkingLotIdx, section, location, carNum);
        //부정주차 RDS에 저장
        const addToUndone = await indexDao.addToUndone(parkingLotIdx, section, location, carNum); 
    }

    //dynamoDB에 저장
    // //const [addToDynamo] = await indexDao.addToDynamo(parkLocation, createdTime, electric, carNum, disabled, inOut);
    
    return res.render("test.ejs");
}

exports.banDoneList = async function(req, res){
    const carNum = req.body.carNum;
    const addToDone = await indexDao.addToDone(carNum);
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


exports.mail = async function(req, res){
    let emailParam = {
        subject: "[알림] 부정주차 차량",
        text:"삐용",
    }
    mailer.sendGmail(emailParam);
    res.status(200).send("성공");
}