require('dotenv').config();

const pool = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PW,
    database: process.env.DB_NAME
};

module.exports = {
    pool: pool,
    pool2: pool
};
