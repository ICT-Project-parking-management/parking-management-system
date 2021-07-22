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

    console.log(complexName, areas);
    return res.render("main.ejs", {complexName, areas});
}

// exports.main = async function (req, res) {
//     const idx = req.params.idx;

//     /**
//      * Todo 210703
//      * - path variable로 주차장 인덱스를 받으면 해당 인덱스의 실시간 주차 구역 정보 제공
//      * - 지금은 DB 연결이 안되어있어서 인덱스 그대로 반환
//      */

//     return res.render("main.ejs", {idx});
// }