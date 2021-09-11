const indexDao = require("../dao/indexDao");
const mailer = require("../../config/mailer");

exports.sendMail = async function(parkingLotIdx, section, location, carNum, violationDesc) {
    const complexName = await indexDao.getComplexName(parkingLotIdx);
    const emailParam = await mailer.createEmailContent(complexName, section, location, carNum, violationDesc);
    await mailer.sendGmail(emailParam);
}