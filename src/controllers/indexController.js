const indexDao = require("../dao/indexDao");

exports.example = async function (req, res) {
    return res.render("intro.ejs");
}

exports.main = async function (req, res) {
    return res.render("main.ejs");
}