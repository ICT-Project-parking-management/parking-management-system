const indexDao = require("../dao/indexDao");
const indexService = require("../services/indexService");
const { VIOLATION_ELECTRIC, VIOLATION_DISABLED } = require("../../type/violation");
const { TOTAL, RESIDENTS, VISITOR } = require("../../type/userRole");

exports.parkingData = async function (req, res) {
    // 등록된 주차장 리스트 조회
    const parkingLotList = await indexDao.getParkingList();
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    console.log('req.session.status >>', req.session.status);
    const parkingLotIdx = req.params.idx;
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

            // 리턴
            if (areas.length == AreaRows.length) {
                const floor = {floorName, areas};
                parkingLotInfo.push(floor);

                if (parkingLotInfo.length == floorRows.length) {
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
                    const [unreadViolation] = await indexDao.unreadViolation();
                   
                    var objLength = Object.keys(unreadViolation).length;
                    var violationList = [];
                    for(var i=0; i< objLength; i++){
                        violationList[i] = JSON.parse(JSON.stringify(unreadViolation))[i];
                        const [parkingLotName] = await indexDao.getComplexName(violationList[i].parkingLotIndex);
                        violationList[i].complexName = parkingLotName.complexName;
                    }                    
                    return res.render("main.ejs", {complexName, parkingLotInfo, parkingLotIdx, userName, violationList});
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

exports.violation = async function (req, res) {
    const info = req.body.info;
    const type = info.type; // parking or snapshot
    const createdAt = info.createdAt;
    const data = req.body.data;

    // const check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

    let dataValid = true;
    let dynamoUpdate = true;
    let dynamoInsert = true;
    let dynamoRead = true;
    let sendMail = true;
    let rdsInsert = true;
    let rdsRead = true;
    // info 값 제대로 안 들어온 경우
    if (type === undefined || type === "" || createdAt === undefined || createdAt === "") {
        return res.sendStatus(400);
    }

    // createdAt 형식 잘못된 경우 (바른 예: 2021-09-18 17:41:13)
    if (createdAt[4] !== "-" || createdAt[7] !== "-" || createdAt[10] !== " " || createdAt[13] !== ":" || createdAt[16] !== ":") {
        console.log(createdAt[4], createdAt[7], createdAt[10], createdAt[13], createdAt[16]);
        return res.sendStatus(401);
    }

    data.forEach(async (element) => {
        const parkLocation = element.parkLocation;
        const inOut = element.inOut;
        const carNum = element.carNum;
        const electric = element.electric;
        const disabled = element.disabled;
       
        // parkLocation, inOut 값 제대로 안 들어온 경우
        if (parkLocation === undefined || parkLocation === "" || inOut === undefined || inOut === "") {
            dataValid = false;
            return false;
        }

        // inOut 형식 잘못된 경우 (in/out)
        if (inOut !== "in" && inOut !== "out") {
            dataValid = false;
            return false;
        }   

        if (inOut === "in") {
            // carNum, electric, disabled 값 제대로 안 들어온 경우
            if (carNum === undefined || carNum === "" || electric === undefined || electric === "" || disabled === undefined || disabled === "") {
                dataValid = false;
                return false;
            }
            // carNum 형식 잘못된 경우 (바른 예: 12가3456)
            // if (isNaN(Number(carNum.substr(0, 2))) || !check.test(carNum[2]) || carNum[3] === " " || isNaN(Number(carNum.substr(3, 4))) || carNum.length !== 7) {
            //     dataValid = false;
            //     return false;
            // }
            // electric, disabled 형식 잘못된 경우 (0/1)
            if ((electric !== 0 && electric !== 1) || (disabled !== 0 && disabled !== 1)) {
                dataValid = false;
                return false;
            }
        }     

        // 1. type 확인
        if (type === "parking") {
            // 1-1. DyanmoDB 데이터 추가
            try {
                if (inOut === "in") await indexDao.addInToDynamo(parkLocation, createdAt, electric, carNum, disabled, inOut);
                else if (inOut === "out") await indexDao.addOutToDynamo(parkLocation, createdAt, inOut);
                console.log('DynamoDB Update');
            } catch (err) {
                console.log('DynamoDB Update Error', err);
                dynamoUpdate = false;
                return false;
            }
        } else if (type === "snapshot") {
            // 1-2-1. DynamoDB 조회 (해당 주차구역에 대한 정보 Update 목적)
            try {
                const [rows] = await indexDao.getCurrParkData(parkLocation);
                // 1-2-2. 해당 주차구역에 대한 정보가 없거나, Update 되어 있지 않은 경우 DynamoDB 데이터 추가
                if (rows === undefined || rows.carNum !== carNum || rows.inOut !== inOut) {
                    try {
                        if (inOut === "in") await indexDao.addInToDynamo(parkLocation, createdAt, electric, carNum, disabled, inOut);
                        else if (inOut === "out") await indexDao.addOutToDynamo(parkLocation, createdAt, inOut);
                        console.log('DynamoDB Insert New Data');
                    } catch (err) {
                        console.log('DynamoDB Insert Error', err);
                        dynamoInsert = false;
                        return false;
                    }
                }
            } catch (err) {
                console.log('DynamoDB Read Error', err);
                dynamoRead = false;
                return false;
            }
        }

        // 2. 부정주차 여부 확인
        if (inOut === "in") {
            let parkingLotIdx = parkLocation.substr(0, 1);
            let section = parkLocation.substr(2, 2);
            let location = parkLocation.substr(4, 2);
            // 2-1. RDS 조회
            try {
                const [rows] = await indexDao.getSpecificAreaInfo(parkingLotIdx, section, location);
                const areaInfo = rows.areaInfo; //일반 0 장애인 1 전기 2

                // 2-2. 부정주차 시 RDS 데이터 추가
                if (disabled === 0 && areaInfo === 1) {
                    console.log('부정주차 - 장애인차량 전용 구역 주차');
                    try {
                        await indexDao.addViolation(parkingLotIdx, section, location, carNum, VIOLATION_DISABLED, createdAt);
                        try {
                            // 메일 전송
                            await indexService.sendMail(parkingLotIdx, section, location, carNum, VIOLATION_DISABLED);
                        } catch (err) {
                            console.log('Send Mail Error', err);
                            sendMail = false;
                            return false;
                        }
                        try {
                            // SMS 전송
                            await indexService.sms(
                                parkingLotIdx, section, location, carNum, VIOLATION_DISABLED
                            );
                        } catch(err) {
                            console.log(`Send SMS Error : `);
                        }
                    } catch (err) {
                        console.log('RDS Insert Error', err);
                        rdsInsert = false;
                        return false;
                    }
                } else if (electric === 0 && areaInfo === 2) {
                    console.log('부정주차 - 전기차 전용 구역 주차');
                    try {
                        await indexDao.addViolation(parkingLotIdx, section, location, carNum, VIOLATION_ELECTRIC, createdAt);
                        try {
                            // 메일 전송
                            await indexService.sendMail(parkingLotIdx, section, location, carNum, VIOLATION_ELECTRIC);
                        } catch (err) {
                            console.log('Send Mail Error', err);
                            sendMail = false;
                            return false;
                        }
                        try {
                            // SMS 전송
                            await indexService.sms(
                                parkingLotIdx, section, location, carNum, VIOLATION_ELECTRIC
                            );
                        } catch(err) {
                            console.log(`Send SMS Error : `);
                        }
                    } catch (err) {
                        console.log('RDS Insert Error', err);
                        rdsInsert = false;
                        return false;
                    }
                } else {
                    console.log('부정주차 차량 아님');
                }
            } catch (err) {
                console.log('RDS Read Error', err);
                rdsRead = false;
                return false;
            }
        } else {
            // inOut = out인 경우

            // 1. DynamoDB 조회하여 해당 주차구역에 최근에 주차(inOut = in)한 차량 정보 확인 (세린)
            const carInfo = await indexDao.getCarInfoByArea(parkLocation);
            if (carInfo == undefined || carInfo == null) {
                console.log('carInfo >', carInfo); // 차량 정보
            } else {
                // 2. 부정주차 여부 확인 (소연)
                let areaNumber = carInfo.areaNumber;
                let carNum = carInfo.carNum;
                let parkingLotIdx = areaNumber.substr(0,1);
                let section = areaNumber.substr(2,2);
                let location = areaNumber.substr(4,4);
                const checkViolation = await indexDao.checkViolation(parkingLotIdx, section, location, carNum);

                // 3. 출차한 차량이 부정주차였을 시 violation DB에 추가 (inOut = out) (소연)
                if(violationIdx !== "undefined" || violationIdx !== null || violationIdx !== ""){ //checkViolation[0].length가 0인 경우 부정주차차량 아님
                    let violationIdx = checkViolation[0].violationIndex;
                    let description = checkViolation[0].description;
                    let createdAt = carInfo.createdTime;
                    await indexDao.outViolation(parkingLotIdx, section ,location, carNum, description, createdAt);  
                    await indexDao.statusOut(violationIdx);
                    console.log("부정주차 차량 출차");
                }                
            }
        }
    });
    if (!dataValid) return res.sendStatus(402);
    else if (!dynamoUpdate) return res.sendStatus(500);
    else if (!dynamoInsert) return res.sendStatus(501);
    else if (!dynamoRead) return res.sendStatus(502);
    else if (!sendMail) return res.sendStatus(503);
    else if (!rdsInsert) return res.sendStatus(504);
    else if (!rdsRead) return res.sendStatus(505);
    else return res.sendStatus(200);
}

exports.readToViolation = async function(req, res){
    const violationIdx = req.body.violationIndex;
    await indexDao.readViolation(violationIdx);
}

exports.doneToViolation = async function(req, res){
    const violationIdx = req.body.violationIndex;
    await indexDao.doneViolation(violationIdx);
}

exports.visitor = async function(req, res) {
    const parkingLotIdx = req.params.idx;

    const parkingLotInfo = [];
    const floorRows = await indexDao.getFloors(parkingLotIdx); // 주차장 층 조회
    floorRows.forEach(async function (e1) {
        const floorName = e1.floor;
        let areas = []
        const AreaRows = await indexDao.getAreas(parkingLotIdx, floorName);
        AreaRows.forEach(async function (e2) {
            const areaName = e2.areaName;
            const areaInfo = e2.areaInfo;
            const area = {areaName, areaInfo};
            areas.push(area);
        })
        if (areas.length == AreaRows.length) {
            const floor = {floorName, areas};
            parkingLotInfo.push(floor);
            if (parkingLotInfo.length == floorRows.length) {
                parkingLotInfo.sort((a, b) => {
                    return (a.floorName < b.floorName) ? -1 : (a.floorName > b.floorName) ? 1 : 0;
                })
                parkingLotInfo.forEach((e) => {
                    e.areas.sort((a, b) => {
                        return (a.areaName < b.areaName) ? -1 : (a.areaName > b.areaName) ? 1 : 0;
                    })
                })
                return res.render("visitor.ejs", {parkingLotInfo});
            }
        }
    })
}

exports.recommend = async function(req, res) {
    const now = req.query.now;
    const period = req.query.period;
    const type = req.query.type;    
    const areas = await indexDao.getLocationForVisitor(now, period, type);
    const returnData = [];
    for (let i = 0; i < areas.length; i++) {
        returnData.push({complexName: areas[i].complexName, floor: areas[i].floor, areaName: areas[i].areaName})
    }
    res.json(returnData);
}

exports.resident = async function(req, res) {
    if (req.session.status === "resident") {
        const userName = req.session.nickname;
        const row = await indexDao.getUserIndex(userName);
        const userIndex = row[0].userIndex;
        const locationData = [];

        try {
            const locations = await indexDao.getLocationForResidents(userIndex);
            for (let i = 0; i < locations.length; i++) {
                locationData.push({complexName: locations[i].complexName, floor: locations[i].floor, areaName: locations[i].areaName})
            }
            return res.render("resident.ejs", {userName, locationData});
        } catch(err) {
            console.log(err);
            return res.sendStatus(200);
        }
    } else {
        return res.sendStatus(200);
    }
}

exports.loginCheck = async function(req, res){
    const select = req.params.idx;

    const userID = req.body.username;
    const userPW = req.body.password;

    const rows = await indexDao.getUserList(userID, userPW);
    const userName = rows[0];
    const authPw = rows[1];
    const userIndex = rows[2];
    const status = rows[3];
    
    if (authPw.length > 0) { //로그인 성공
        req.session.nickname = userID;
        if (status == 0) {
            req.session.status = "admin";
        } else {
            req.session.status = "resident";
        }
        req.session.save(function(){
            const data = {"status": 200};
            res.send(data)
        });
    } else { //로그인 실패
        let status = -1;
        if (userName.length > 0) //비밀번호 틀림
            status = 201;
        else
            status = 202; //아이디 틀림
       
        const data = {status};
        res.send(data);
    }
}  

exports.logoutCheck = async function(req, res){
    req.session.destroy(function(){
        req.session;
    })
    res.send();
}

exports.allViolation = async function(req, res){
    if (req.session.status === "admin") {
        const [inOutViolation] = await indexDao.totalViolation();
        var objLength = Object.keys(inOutViolation).length;
        var violationList = [];
      
        for(var i=0; i< objLength; i++){
            violationList[objLength-i] = JSON.parse(JSON.stringify(inOutViolation))[i];
            const [parkingLotName] = await indexDao.getComplexName(violationList[objLength-i].parkingLotIndex);
            violationList[objLength-i].complexName = parkingLotName.complexName;
        }
        res.render("violate.ejs", {violationList});      
    } else {
       res.render("main.ejs");
    }
}

exports.getPossession = async function(req, res){
    if (req.session.status === "admin") {
        // 거주자 & 방문자 점유율
        const [totalPossession] = await indexDao.getPossession(TOTAL);
        const totalData = [];
        // 거주자 점유율
        const [residentPossession] = await indexDao.getPossession(RESIDENTS);
        const residentData = [];

        const [visitorPossession] = await indexDao.getPossession(VISITOR);
        const visitorData = [];

        for (var i=0; i<totalPossession.length; i++) {
            totalData.push({ time: totalPossession[i].time, value: Number(totalPossession[i].possession ) })
            residentData.push({ time: residentPossession[i].time, value: Number(residentPossession[i].possession) })
            visitorData.push({ time: visitorPossession[i].time, value: Number(visitorPossession[i].possession) })
        }

        return res.render("adminAnalyze.ejs", {totalData, residentData, visitorData});
    } else {
        return res.render("main.ejs");
    }
}

exports.smsTest = async function(req, res) {
    const parkingLotIdx = 1;
    const section = "B1";
    const location = "A1";
    const carNum = "12가3456";
    const violationDesc = VIOLATION_DISABLED;

    await indexService.sms(
        parkingLotIdx, section, location, carNum, violationDesc
    );
    return res.sendStatus(200);
}