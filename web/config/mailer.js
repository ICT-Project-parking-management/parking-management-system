require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendGmail(param){
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PW
        }
    })
    let toEmail = "jeongsoyeon0130@naver.com"; //관리자 메일로 변경
    let mailOptions = {
        from: process.env.EMAIL_ID,
        to: toEmail,
        subject: param.subject,
        text: param.text
    };
    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        }else{
            console.log('이메일 보냈다');
        }
    });
}

module.exports = {
    sendGmail
};