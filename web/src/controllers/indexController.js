const indexDao = require("../dao/indexDao");

exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    // Dynamo Example
    await indexDao.dynamoExample(1);
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    const idx = req.params.idx;
    const rows = await indexDao.getComplexName(idx);

    const complexName = rows[0];
    const areas = rows[1];
    const B1 = rows[2];
    const B2 = rows[3];

    console.log(complexName, areas);
    return res.render("main.ejs", {complexName, areas, B1, B2});
}