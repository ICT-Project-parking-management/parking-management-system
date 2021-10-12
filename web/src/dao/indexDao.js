const { pool } = require("../../config/database");
const { AWS } = require('../../config/dynamo');

async function getUserList(userID, userPW) {
    const connection = await pool.getConnection(async (conn)=> conn);
    const [idRows, idFields] = await connection.query(`SELECT userID FROM User WHERE userID = ?`, [userID]);
    if (idRows.length > 0) {
        var [pwRows, pwFields] = await connection.query(`SELECT userID, userPW FROM User WHERE userID = ? AND userPW = ?`, [userID, userPW]);
        var userName = JSON.parse(JSON.stringify(idRows))[0].userID;
        var [indexRows, indexFields] = await connection.query(`SELECT userIndex, status FROM User WHERE userID = ?`, userName);
        var userIndex = JSON.parse(JSON.stringify(indexRows))[0].userIndex;
        var status = JSON.parse(JSON.stringify(indexRows))[0].status;
    }
    else {
        userName = [];
        userIndex = [];
        pwRows = [];
    }
    connection.release();
    return [userName, pwRows, userIndex, status];
} 

async function getUserIndex(userID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT userIndex FROM User WHERE userID = '${userID}';`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
}

async function getParkingList() {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT parkingLotIndex, complexName FROM ParkingLot;`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows
}

 async function getComplexName(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT complexName FROM ParkingLot WHERE parkingLotIndex = ${idx};`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
}

async function getFloors(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT DISTINCT floor FROM ParkingArea WHERE parkingLotIndex = ${idx};`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
}

 async function getAreas(idx, floorName) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT areaName, areaInfo FROM ParkingArea WHERE parkingLotIndex = ? AND floor = ?;`;
    const Params = [idx, floorName];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return rows;
}

async function getCurrParkData(areaNumber) {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: "parking",
        ProjectionExpression: "#areaNumber, createdTime, carNum, disabled, electric, #inOut",
        KeyConditionExpression: "#areaNumber = :num",
        ExpressionAttributeNames:{
            "#areaNumber": "areaNumber",
            "#inOut": "inOut"
        },
        ExpressionAttributeValues: {
            ":num": areaNumber
        },
        ScanIndexForward: false,
        Limit: 1
    }
    const data = await dynamo.query(params).promise();
    return data.Items;
}

async function getMyCars(idx, userIndex) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT carNum AS cars FROM Car WHERE userIndex = ${userIndex};`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
}

async function getMyAreas(carNum) {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: "parking",
        ProjectionExpression: "#areaNumber, createdTime, #carNum, disabled, electric, #inOut",
        FilterExpression: "#carNum = :carNum",
        ExpressionAttributeNames:{
            "#areaNumber": "areaNumber",
            "#inOut": "inOut",
            "#carNum": "carNum"
        },
        ExpressionAttributeValues: {
            ":carNum": carNum,
        },
        ScanIndexForward: false,
    }
    const data = await dynamo.scan(params).promise();
    return data.Items;
};

async function addInToDynamo(parkLocation, createdTime, electric, carNum, disabled, inOut) {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: "parking",
        Item: {
            areaNumber: parkLocation,
            createdTime: createdTime,
            carNum: carNum,
            disabled: disabled,
            electric: electric,
            inOut: inOut
        }
    };
    const data = await dynamo.put(params).promise();
    return;
};

async function addOutToDynamo(parkLocation, createdTime, inOut) {
    console.log(parkLocation, createdTime, inOut);
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: "parking",
        Item: {
            areaNumber: parkLocation,
            createdTime: createdTime,
            inOut: inOut
        }
    };
    const data = await dynamo.put(params).promise();
    return;
};

async function getSpecificAreaInfo(parkingLotIdx, floor, area) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT areaInfo FROM ParkingArea WHERE parkingLotIndex = ${parkingLotIdx} AND floor = '${floor}' AND areaName = '${area}';`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
};

async function getCarInfoByArea(areaNumber) {
    const value = "in"
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: "parking",
        ProjectionExpression: "#areaNumber, createdTime, carNum, disabled, electric, #inOut",
        FilterExpression: "#areaNumber = :areaNumber AND #inOut = :value",
        ExpressionAttributeNames:{
            "#areaNumber": "areaNumber",
            "#inOut": "inOut"
        },
        ExpressionAttributeValues: {
            ":areaNumber": areaNumber,
            ":value": value
        },
        ScanIndexForward: false,
    }
    const data = await dynamo.scan(params).promise();
    return data.Items[data.Items.length - 1];
}

// 부정주차 리스트 추가
async function addViolation(parkingLotIdx, floor, area, carNum, description, createdAt) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `INSERT INTO Violation(parkingLotIndex, floor, name, carNum, description, createdAt)
    VALUES(?, ?, ?, ?, ?, ?);`;
    const Params = [parkingLotIdx, floor, area, carNum, description, createdAt];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return;
}


async function checkViolation(parkingLotIdx, floor, area, carNum){ //출차 한 차량이 부정주차한 차량인지 확인
    const connection = await pool.getConnection(async (conn)=>conn);
    const Query = `SELECT violationIndex, description FROM Violation WHERE parkingLotIndex = ? AND floor = ? AND name = ? AND carNum = ? ;`;
    const Params = [parkingLotIdx, floor, area, carNum];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return rows;
}

async function outViolation(parkingLotIdx,floor, area, carNum, description, createdAt){ //부정주차 차량 출차시 out으로 변경
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `INSERT INTO Violation(parkingLotIndex, floor, name, carNum, description, createdAt, state)
    VALUES (?, ?, ?, ?, ?, ?, ?);`;
    const Params = [parkingLotIdx, floor, area, carNum, description,createdAt, "out"];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return;
}

async function statusOut(parkingLotIdx){
    const connection = await pool.getConnection(async (conn)=> conn);
    const Query = `UPDATE Violation
    SET status = 'out'
    WHERE violationIndex = ${parkingLotIdx};`;
    const [rows] = await connection.query(Query);
    connection.release();
    return;
}
async function totalViolation(){
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT  parkingLotIndex as 'parkingLotIndex', floor as'floor', name as 'name', carNum as 'carNum', description as 'description', DATE_FORMAT(createdAt, '%m월 %d일 %H시 %i분') as createdAt,
    (CASE
        WHEN updatedAt = createdAt THEN '-'
        ELSE DATE_FORMAT(updatedAt, '%m월 %d일 %H시 %i분')
     END) as updatedAt,
    (CASE
        WHEN status = 'unread' THEN '관리자 미처리'
        WHEN status = 'read' THEN '관리자 처리'
        WHEN status = 'out' THEN '출차'
     END) as 'status'

    FROM Violation;`
    const [rows] = await connection.query(Query);
    connection.release();
    return [rows];
}

async function unreadViolation(){
    const connection = await pool.getConnection(async (conn)=>conn);
    const Query = `SELECT violationIndex, parkingLotIndex, floor, name, carNum, description, DATE_FORMAT(createdAt, '%m월 %d일 %H시 %i분') as createdAt
    FROM Violation WHERE status = 'unread' AND state='in' ORDER BY createdAt DESC;`
    const [rows] = await connection.query(Query);
    connection.release();
    return [rows];
};

// 부정주차 확인 시 read 처리
async function readViolation(violationIndex) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `UPDATE Violation
    SET status = 'read'
    WHERE violationIndex = ?;`;
    const Params = [violationIndex];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return;
}

async function doneViolation(violationIndex) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `DELETE FROM Violation WHERE violationIndex = ?`;
    const Params = [violationIndex];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return;
}

// 데이터마이닝 1 - 전체 점유 현황, 거주자 점유 현황 (isResident : bool)
async function getPossession(isTotal) {
    const connection = await pool.getConnection(async (conn)=>conn);
    isTotal = isTotal ? 'total' : 'residents';
    const Query = `
        SELECT time, ROUND(sum(counting)/sum(days)*100, 1) as possession
        FROM d_possession WHERE status = ? GROUP BY time ORDER BY time ASC;
    `;
    const Params = [isTotal];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return [rows];
}

// 데이터마이닝 2 - 방문자 구역 유도 (now : 현재시간 / period : 점유 시간 / type : none 0 disabled 1 electric 2)
async function getLocationForVisitor(now, period, type) {
    const connection = await pool.getConnection(async (conn)=>conn);
    const Query = `
        SELECT pl.complexName, pa.floor, pa.areaName, ROUND((1-sum(pos.counting)/sum(pos.days))*100, 1) as prob
        FROM d_possession pos 
        JOIN ParkingArea pa on pa.location = pos.location
        JOIN ParkingLot pl ON pl.parkingLotIndex = pa.parkingLotIndex
        WHERE pos.status = 'residents' AND IF(TIMEDIFF(pos.time, ?) < TIME(SEC_TO_TIME(?*60*60))
        AND TIMEDIFF(pos.time, ?) >= '00:00:00', TRUE, FALSE) AND pa.areaInfo in (0, ?)
        GROUP BY pos.location ORDER BY prob ASC LIMIT 3;
    `;
    const Params = [now, period, now, type];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return rows;
}

// 데이터마이닝 4 - 거주자 구역 추천 (userIndex : int)
async function getLocationForResidents(userIndex) {
    const connection = await pool.getConnection(async (conn)=>conn);
    const Query = `
    SELECT pl.complexName, pa.floor, pa.areaName, ROUND((1-(counting/days))*100, 1) as prob
    FROM d_popular_edit pop
    JOIN Car car on car.carNum = pop.num
    JOIN User user on car.userIndex = user.userIndex
    JOIN (SELECT location, counting, days
        FROM d_possession
        WHERE status = 'total' AND time = (
            SELECT time FROM d_popular_time WHERE num in (SELECT c.carNum From Car c WHERE c.userIndex = ?)
        )) pos on pop.location = pos.location
    JOIN ParkingArea pa on pa.location = pos.location
    JOIN ParkingLot pl ON pl.parkingLotIndex = pa.parkingLotIndex
    WHERE user.userIndex = ? AND
        IF(car.disabled = 0 AND pa.areaInfo = 1, FALSE, TRUE) AND
        IF(car.electric = 0 AND pa.areaInfo = 2, FALSE, TRUE)
    ORDER BY pop.\`order\` ASC LIMIT 3;
    `;
    const Params = [userIndex, userIndex];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return rows;
}

module.exports = {
    getUserList,
    getUserIndex,
    getParkingList,
    getComplexName,
    getFloors,
    getAreas,
    getCurrParkData,
    getMyCars,
    getMyAreas,
    addInToDynamo,
    addOutToDynamo,
    getSpecificAreaInfo,
    getCarInfoByArea,
    addViolation,
    outViolation,
    checkViolation,
    readViolation,
    unreadViolation,
    getPossession,
    getLocationForVisitor,
    totalViolation,
    doneViolation,
    statusOut,
    getLocationForResidents
};