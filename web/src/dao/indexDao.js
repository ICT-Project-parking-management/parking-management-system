const { pool } = require("../../config/database");
const { AWS } = require('../../config/dynamo');

/**
 * update: 2021.08.08
 * author: serin
 * connect : RDS
 * desc : 등록된 주차장 리스트 조회
 */
async function getParkingList() {
    const connection = await pool.getConnection(async (conn) => conn);
    const getParkingListQuery = `SELECT parkingLotIndex, complexName FROM ParkingLot;`;
    const [rows] = await connection.query(getParkingListQuery);
    connection.release();
    return rows
}

/**
 * update: 2021.08.08
 * author: serin
 * connect : RDS
 * desc : 주차장 이름 조회
 */
 async function getComplexName(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const getComplexNameQuery = `
    SELECT complexName FROM ParkingLot WHERE parkingLotIndex = ${idx};
    `;
    const [rows] = await connection.query(getComplexNameQuery);
    connection.release();
    return rows;
}

/**
 * update: 2021.08.08
 * author: heedong
 * connect : RDS
 * desc : 주차장 층 조회
 */
async function getFloors(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `
    SELECT DISTINCT floor FROM ParkingArea WHERE parkingLotIndex = ${idx};
    `;
    const [rows] = await connection.query(Query);
    connection.release();
    return rows;
}

/**
 * update: 2021.08.08
 * author: heedong
 * connect : RDS
 * desc : 층별 구역 정보 조회
 */
 async function getAreas(idx, floorName) {
    const connection = await pool.getConnection(async (conn) => conn);
    const Query = `
    SELECT areaName, areaInfo FROM ParkingArea WHERE parkingLotIndex = ? AND floor = ?;
    `;
    const Params = [idx, floorName];
    const [rows] = await connection.query(Query, Params);
    connection.release();
    return rows;
}

async function getCurrParkData(areaNumber) {

    // idx = 주차장 인덱스
    // RDS => 해당 주차장의 주차구역 & 정보(장애인전용/전기차전용/일반전용) 확인
    // DynamoDB => 해당 주차장의 특정 주차구역의 가장 최신 정보(차정보/inOut 등) 확인
    // 주차된 위치 표시 & 주차 위반 여부 팝업

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

async function getMyArea(idx, userIndex) {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: dynamo_config.table_name,
        KeyConditionExpression: 'parkingId = :id',
        ExpressionAttributeValues: {
            ':id': id
        }
    }

    await dynamo.query(params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const { Items } = data;
            console.log(Items);
            return Items;
        }
    });
}

module.exports = {
    getParkingList,
    getComplexName,
    getFloors,
    getAreas,
    getCurrParkData,
    getMyArea,
    
};