const AWS = require('aws-sdk');
require('dotenv').config();

// 로컬 연결
const awsLocalConfig = {
    region: 'local',
    endpoint: 'http://localhost:8000'
};
// 원격 연결
const awsRemoteConfig = {
    accessKeyId: process.env.DYNAMO_ACCESSKEY,
    secretAccessKey: process.env.DYNAMO_SECRET_ACCESSKEY,
    region: process.env.DYNAMO_REGION
};

AWS.config.update(awsRemoteConfig);
const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports = {
    dynamo: dynamo
};