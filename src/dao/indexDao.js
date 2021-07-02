const { pool } = require("../../config/database");

async function example() {
    const connection = await pool.getConnection(async (conn) => conn);
    const exampleQuery = ``;
    const [rows] = await connection.query();
    return rows;
}

module.exports = {
    example,
};