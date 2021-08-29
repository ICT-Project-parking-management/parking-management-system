const express = require('./config/express');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );
require('dotenv').config();

const app = express();
const PORT = process.env.NODE_PORT;

// 3000 포트로 서버 오픈
app.listen(PORT, function() {
    console.log(`Server At Port ${PORT}`);
})