// node_modules의 express 관련 파일 가져옴
var express = require('express');

module.exports = function () {
    const app = express();

    app.set("view engine", "ejs");
    app.set("views", process.cwd() + "/views");

    require("../src/routes/indexRoute")(app);

    return app;   
}