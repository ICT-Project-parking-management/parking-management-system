const AWS = require('aws-sdk');
const dynamo_config = require('../../config/dynamo');
const { pool } = require("../../config/database");

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

async function getCurrParkData(idx) {

    // idx는 주차장 인덱스
    // 우선 RDS에서 해당 주차장 인덱스에 대한 주차구역 & 장애인전용/전기차전용/일반 여부 뽑아옴
    // dynamo 접근해서 해당 주차장에 in 한 차량의 차량번호 & location 불러옴
    // 위반 여부 판단

    const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'}); // 이걸로 할 때 지원하는 걸아
    const docClient = new AWS.DynamoDB.DocumentClient(); // 이걸로 할 때 지원하는 게 좀 다르네

    //dynamo_config.table_name

    const params = {
        TableName: "parkingData",
        KeyConditionExpression: 'idx = :idx',
        ExpressionAttributeValues: {
            ':idx': idx
        }
    };

    try {
        await docClient.query(params, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                console.log('data >>', data);
            }
        })

        // await dynamo.describeTable(params, (err, data) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         const { Items } = data;
        //         console.log('Items >>', Items);
        //         return Items;
        //     }
        // })

    } catch (err) {
        console.log(err);
    }
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