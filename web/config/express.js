// node_modules의 express 관련 파일 가져옴
const express = require('express');

module.exports = function () {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.set("view engine", "ejs");
    app.set("views", process.cwd() + "/views");

    app.use(express.static(process.cwd() + '/static'));
    
    require("../src/routes/indexRoute")(app);

    return app;   
}