const indexDao = require("../dao/indexDao");

exports.example = async function (req, res) {

    /**
     * Todo 210703
     * - 인덱스 페이지에서 DB에 저장되어 있는 주차장 목록을 제공
     * - 현재 DB 연결이 되어있지 않기 때문에 변수(더미데이터)로 주차장 리스트 제공
     * - DB 연결 후 수정 요함
     */
    const parkingLotList = [
        {
            parkingLotIndex : 1,
            name : "A 주차장"
        },
        {
            parkingLotIndex : 2,
            name : "B 주차장"
        },
        {
            parkingLotIndex : 3,
            name : "C 주차장"
        }
    ];

    // Dynamo Example
    await indexDao.dynamoExample(1);

    return res.render("intro.ejs", {parkingLotList});
}

exports.main = async function (req, res) {
    const idx = req.params.idx;

    /**
     * Todo 210703
     * - path variable로 주차장 인덱스를 받으면 해당 인덱스의 실시간 주차 구역 정보 제공
     * - 지금은 DB 연결이 안되어있어서 인덱스 그대로 반환
     */

    return res.render("main.ejs", {idx});
}