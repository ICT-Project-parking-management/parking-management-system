require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendGmail(param){
    var transporter = nodemailer.createTransport({
        service:'gmail',
        prot: 587,
        host: 'smtp.gmail.com',
        secure: false,
        requireTLS: true,
        auth:{
            user: process.env.EMAIL_ID,
            pass: process.end.EMAIL_PW
        }
    });
    var mailOptions = { //메일옵션
        from: process.env.EMAIL_ID,
        to: param.toEmail,
        subject: param.subject,
        text: param.text
    };
    //메일발송
    transporter.sendMail(mailOptions, async function(err, info){
        if(err){
            console.log(err);
        }else{
            console.log('Email sent: ', info.res);
        }
    });
}


module.exports = {
    sendGmail
};