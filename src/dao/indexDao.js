const AWS = require('aws-sdk');
const dynamo_config = require('../../config/dynamo');
const { pool } = require("../../config/database");

AWS.config.update(dynamo_config.aws_remote_config);

async function example() {
    const connection = await pool.getConnection(async (conn) => conn);
    const exampleQuery = ``;
    const [rows] = await connection.query();
    return rows;
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

module.exports = {
    example,
    dynamoExample,
};