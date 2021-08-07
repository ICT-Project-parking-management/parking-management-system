const indexDao = require("../dao/indexDao");

const request = require('request');
const jwt = require('jsonwebtoken');


exports.parkingData = async function (req, res) {
    const parkingLotList = await indexDao.getParkingList();
    // Dynamo Example
    const ress = await indexDao.dynamoExample(1);

    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    const idx = req.params.idx;
    const rows = await indexDao.getComplexName(idx);

    const complexName = rows[0];
    const areas = rows[1]; // 모든 주차구역 리스트
    const B1 = rows[2]; // B1층 주차구역 리스트
    const B2 = rows[3]; // B2층 주차구역 리스트

    console.log('주차구역 >>', areas);

    const rows2 = await indexDao.getCurrParkData(idx, areas);
    //console.log('rows2 >>', rows2);

    return res.render("main.ejs", {complexName, areas, B1, B2});
}

exports.myArea = async function (req, res) {
    //const userIndex = req.verifiedToken.id;
    const idx = req.params.idx;
    const userIndex = 1; // 테스트용
    const rows = await indexDao.getMyArea(idx, userIndex);

    return res.render("main.ejs", {myArea})
}