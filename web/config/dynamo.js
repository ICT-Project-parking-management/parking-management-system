require('dotenv').config();

module.exports = {
    table_name: process.env.DYNAMO_TABLE_NAME,
    aws_local_config: {
        region: 'local',
        endpoint: 'http://localhost:8000'
    },
    aws_remote_config: {
        accessKeyId: process.env.DYNAMO_ACCESSKEY,
        secretAccessKey: process.env.DYNAMO_SECRET_ACCESSKEY,
        region: process.env.DYNAMO_REGION
    }
};