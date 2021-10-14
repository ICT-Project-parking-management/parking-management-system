const indexDao = require("../dao/indexDao");
const mailer = require("../../config/mailer");
const sns = require("../../config/sns");

exports.sendMail = async function(parkingLotIdx, section, location, carNum, violationDesc) {
    const row = await indexDao.getComplexName(parkingLotIdx);
    const complexName = row[0].complexName;
    const emailParam = await mailer.createEmailContent(complexName, section, location, carNum, violationDesc);
    await mailer.sendGmail(emailParam);
}

exports.sms = async function(parkingLotIdx, section, location, carNum, violationDesc) {
    const row = await indexDao.getComplexName(parkingLotIdx);
    const complexName = row[0].complexName;
    const smsParams = await sns.createSMSParams(complexName, section, location, carNum, violationDesc);
    await sns.sendSMS(smsParams);
}