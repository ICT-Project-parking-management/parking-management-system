const express = require('express');
const bodyParser = require('body-parser');
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { pool } = require("./database");

module.exports = function () {
    const app = express();
    const sessionStore = new MySQLStore(pool); //express-mysql-session의 MySQLStroe(options). 파라미터 options에 createPool이
    
    app.set("view engine", "ejs");
    app.set("views", process.cwd() + "/views");

    app.use(express.static(process.cwd() + '/static'));
    app.use(bodyParser.urlencoded({extended:false}));
    app.use(session({
        key: "session_cookie_name",
        secret: "session_cookie_secret",
        resave: false,
        saveUninitialized: true,
        store: sessionStore
    }));
    

    require("../src/routes/indexRoute")(app);

    return app;   
}