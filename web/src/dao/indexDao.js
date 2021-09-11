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

async function addToDynamo(parkLocation, createdTime, electric, carNum, disabled, inOut) {
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

async function getSpecificAreaInfo(parkingLotIdx, floor, area) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `SELECT areaInfo FROM ParkingArea WHERE parkingLotIndex = ${parkingLotIdx} AND floor = '${floor}' AND areaName = '${area}';`;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
};

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

async function addToUndone(parkingLotIdx, floor, area, carNum){
    const connection = await pool.getConnection(async (conn) => conn);
    const Query= `INSERT INTO Undone (parkingLotIndex, floor, areaName, carNum) VALUES(?, ?, ?, ?);`;
    const Params = [parkingLotIdx, floor, area, carNum];
    const [rows] = await connection.query(Query, Params);
    // const Query = `DELETE FROM Undone WHERE parkingLotIndex=1`;
    // const [rows] = await connection.query(Query);
    connection.release();
    return;
}

async function readToUndone() {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query= `SELECT * FROM Undone;`;
    const [rows] = await connection.query(Query);
    connection.release();
    return [rows];
}

async function addToDone(carNum) {
    const connection = await pool.getConnection(async (conn) => conn);
    const QueryOne = `SELECT * FROM Undone WHERE carNum= '${carNum}';`;
    const [rowsOne] = await connection.query(QueryOne);
    console.log(rowsOne);
    const data = JSON.parse(JSON.stringify(rowsOne))[0];
    const QueryTwo= `INSERT INTO Done (parkingLotIndex, floor, areaName, carNum) VALUES(?, ?, ?, ?);`;
    const Params = [data.parkingLotIndex, data.floor, data.areaName, data.carNum];
    const [rowsTwo] = await connection.query(QueryTwo, Params);
    const QueryThree = `Delete From Undone WHERE carNum= '${carNum}';`;
    const [rowsThree] = await connection.query(QueryThree);
    connection.release();
    return;
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
    addToDynamo,
    getSpecificAreaInfo,
    addToUndone,
    readToUndone,
    addToDone,
    addViolation,
    readViolation
};