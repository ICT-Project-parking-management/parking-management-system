const indexDao = require("../dao/indexDao");

exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    const idx = req.params.idx;
    const complexName = await indexDao.getComplexName(idx);
    return res.render("main.ejs", {complexName});
}