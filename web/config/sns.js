require('dotenv').config();
const AWS_SNS = require('aws-sdk');
const ADMIN_TEL = process.env.TEL_NUM;


async function createSMSParams(complexName, section, location, carNum, violationDesc) {
    return {
        PhoneNumber: ADMIN_TEL,
        Message: `주차장 : ${complexName}\n위치 : ${section}-${location}\n부정주차 사유: ${violationDesc} `,
    };
}

async function sendSMS(params) {
    AWS_SNS.config.update({
        region: process.env.SNS_REGION
    });
    const sns = new AWS_SNS.SNS(
        {
            apiVersion: '2010-03-31'
        }
    )

    sns.publish(params, (err, data)=> {
        if (err) {
            console.error(err, err.stack);
        } else {
            console.log("SMS 전송 완료");
        }
    });
};

module.exports = {
    createSMSParams,
    sendSMS
};
