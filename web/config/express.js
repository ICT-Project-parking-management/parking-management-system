// node_modules의 express 관련 파일 가져옴
const express = require('express');
const session = require('express-session');
const MySQLStore = require("express-mysql-session")(session);
const { DB_CONFIG } = require("./database");

module.exports = function () {
    const app = express();
    const sessionStore = new MySQLStore(DB_CONFIG);

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.set("view engine", "ejs");
    app.set("views", process.cwd() + "/views");

    app.use(express.static(process.cwd() + '/static'));
    
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