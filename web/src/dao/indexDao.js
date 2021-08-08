const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');
const dynamo_config = require('../../config/dynamo');
const { pool } = require("../../config/database");
const newPool = mysql.createPool(pool); 

AWS.config.update(dynamo_config.aws_remote_config);

async function getParkingList() {
    const connection = await newPool.getConnection(async (conn) => conn);
    const getParkingListQuery = `SELECT parkingLotIndex, complexName FROM ParkingLot;`;
    const [rows] = await connection.query(getParkingListQuery);
    connection.release();
    return JSON.parse(JSON.stringify(rows));
}//로그인 쿼리문 Dao에 따로 분리.

async function getUserList(userID, userPW){

    const connection = await newPool.getConnection(async (conn)=> conn);
    
    const [rows, fields] = await connection.query(`SELECT userID, userPW FROM User WHERE userID = ? AND userPW = ?`, [userID, userPW]);
    if(rows.length){
        console.log("로그인 성공");
    }else {
        console.log("로그인 실패");
    }

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
            console.log(Items);
            return Items;
        }
    });
}

async function getComplexName(idx) {
    const connection = await newPool.getConnection(async (conn) => conn);
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

module.exports = {
    getParkingList,
    getUserList,
    dynamoExample,
    getComplexName
};