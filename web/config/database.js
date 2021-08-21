const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PW,
    database: process.env.DB_NAME
};
const pool = mysql.createPool(DB_CONFIG); 

module.exports = {
    DB_CONFIG : DB_CONFIG,
    pool : pool
};
