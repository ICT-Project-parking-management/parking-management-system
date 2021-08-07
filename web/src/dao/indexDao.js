const AWS = require('aws-sdk');
const dynamo_config = require('../../config/dynamo');
const { pool } = require("../../config/database");
const { Route53Resolver } = require('aws-sdk');

AWS.config.update(dynamo_config.aws_remote_config);

async function getParkingList() {
    const connection = await pool.getConnection(async (conn) => conn);
    const getParkingListQuery = `SELECT parkingLotIndex, complexName FROM ParkingLot;`;
    const [rows] = await connection.query(getParkingListQuery);
    connection.release();
    return JSON.parse(JSON.stringify(rows));
}

async function dynamoExample (id) {
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
            console.log('Items >>', Items);
            return Items;
        }
    });
}

async function getCurrParkData(idx, areas) {

    // idx = 주차장 인덱스
    // RDS => 해당 주차장의 주차구역 & 정보(장애인전용/전기차전용/일반전용) 확인
    // DynamoDB => 해당 주차장의 특정 주차구역의 가장 최신 정보(차정보/inOut 등) 확인
    // 주차된 위치 표시 & 주차 위반 여부 팝업

    var parkDataList = [];
    const dynamo = new AWS.DynamoDB.DocumentClient();

    areas.forEach(async (area) => {
        // 특정 주차구역(parkLocation)의 가장 최근 값만 불러오도록 수정 필요
        const params = {
            TableName: "parkingData",
            ScanIndexForward: true,
            ProjectionExpression: "idx, parkLocation, carNum, classify, #inOut",          
            ExpressionAttributeNames: {
                "#inOut": "inOut"
            },
            FilterExpression: 'parkLocation = :area',
            ExpressionAttributeValues: {
                ":area": area
            }
        }

        const result = await dynamo.scan(params, (err, data) => {
            if (err) {
                console.log(err)
            } else {
                console.log(area, '|', data.Items);
            }
        });
    })
}

async function getComplexName(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const getComplexNameQuery = `
    SELECT complexName,
       (SELECT GROUP_CONCAT(areaName) FROM ParkingArea WHERE parkingLotIndex = ${idx}) AS areas
       FROM ParkingLot WHERE parkingLotIndex = ${idx};
    `;
    const [rows] = await connection.query(getComplexNameQuery);
    const complexName = JSON.parse(JSON.stringify(rows))[0].complexName;
    var areas = '';

    // B1층, B2층 구분해 데이터 보내주기 위함 => 수정 필요
    var B1 = [];
    var B2 = [];

    if (JSON.parse(JSON.stringify(rows))[0].areas) {
        areas = JSON.parse(JSON.stringify(rows))[0].areas.split(',');
        for (i = 0; i < areas.length; i++) {
            if (areas[i].slice(0, 2) == 'B1') {
                B1.push(areas[i].slice(2, 4));
            }
            else if (areas[i].slice(0, 2) == 'B2') {
                B2.push(areas[i].slice(2, 4));
            }
        }
    }

    connection.release();
    return [complexName, areas, B1, B2]
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
    dynamoExample,
    getCurrParkData,
    getComplexName,
    getMyArea
};