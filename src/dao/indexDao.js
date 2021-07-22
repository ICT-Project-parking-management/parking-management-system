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
    const getComplexNameQuery = `
    SELECT complexName,
       (SELECT GROUP_CONCAT(areaName) FROM ParkingArea) AS areas
       FROM ParkingLot
    WHERE parkingLotIndex = ${idx};
    `;
    const [rows] = await connection.query(getComplexNameQuery);
    const complexName = JSON.parse(JSON.stringify(rows))[0].complexName;
    const areas = JSON.parse(JSON.stringify(rows))[0].areas.split(',');
    
    connection.release();

    return [complexName, areas]
}

module.exports = {
    getParkingList,
    getComplexName
};