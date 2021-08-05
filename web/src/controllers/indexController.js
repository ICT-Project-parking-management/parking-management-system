const indexDao = require("../dao/indexDao");

const request = require('request');
const jwt = require('jsonwebtoken');


exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    // Dynamo Example
    await indexDao.dynamoExample(1);
    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    const idx = req.params.idx;
    const rows = await indexDao.getComplexName(idx);

    const rows2 = await indexDao.getCurrParkData(1); // test


    const complexName = rows[0];
    const areas = rows[1];
    const B1 = rows[2];
    const B2 = rows[3];

    // 주차 정보 임시 데이터
    const parkData = {
        "B1A1": "in",
        "B1A2": "out",
        "B1A3": "out",
        "B2B1": "out",
        "B2B2": "in",
        "B2B3": "in"
    }

    return res.render("main.ejs", {complexName, areas, B1, B2, parkData});
}

exports.myArea = async function (req, res) {
    //const userIndex = req.verifiedToken.id;
    const idx = req.params.idx;
    const userIndex = 1; // 테스트용
    const rows = await indexDao.getMyArea(idx, userIndex);

    return res.render("main.ejs", {myArea})
}