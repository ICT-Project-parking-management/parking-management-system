const express = require('./config/express');
const database = require('./config/database');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

const app = express(); 

// 3000 포트로 서버 오픈
app.listen(3000, function() {
    console.log('Development - Server At Port 3000')
})