const { pool } = require("../../config/database");

async function getParkingList() {
    const connection = await pool.getConnection(async (conn) => conn);
    const getParkingListQuery = `SELECT parkingLotIndex, complexName FROM ParkingLot;`;
    const [rows] = await connection.query(getParkingListQuery);
    connection.release();
    return JSON.parse(JSON.stringify(rows));
}

async function getComplexName(idx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const getComplexNameQuery = `SELECT complexName FROM ParkingLot WHERE parkingLotIndex = ${idx};`;
    const [rows] = await connection.query(getComplexNameQuery);
    connection.release();
    return JSON.parse(JSON.stringify(rows))[0].complexName
}

module.exports = {
    getParkingList,
    getComplexName
};