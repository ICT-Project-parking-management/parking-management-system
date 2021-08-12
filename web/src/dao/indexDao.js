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

async function getUserList(userID, userPW){ //일치 불일치가 검증이 안됨
    const connection = await newPool.getConnection(async (conn)=> conn);
    const [idRows, idFields] = await connection.query(`SELECT userID, userPW FROM User WHERE userID = ? AND userPW = ?`, [userID, userPW]);
    console.log(idRows);
    console.log(idRows.length);
    //userID가 없음
    if(idRows.length > 0){
        var userName = JSON.parse(JSON.stringify(idRows))[0].userID;
        var [indexRows, indexFields] = await connection.query(`SELECT userIndex FROM User WHERE userID = ?`, [userName]);
        var userIndex = JSON.parse(JSON.stringify(indexRows))[0].userIndex;
    }
    else{
        userName=[];
        userIndex=[];
        console.log(userName, userIndex);
    }
   
    //if((idRows.legnth)>0) //로그인 성공시
   
    connection.release();
    return [userName, userIndex];
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