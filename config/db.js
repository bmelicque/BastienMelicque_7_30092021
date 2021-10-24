const mysql = require('promise-mysql');

const connection = mysql.createPool({
    connectionLimit: 20,
    host: 'sql290.main-hosting.eu',
    user: 'u558261387_bmelicque',
    password: process.env.DB_PASSWORD,
    database: 'u558261387_groupomania'
});

console.log('Connected to MySQL');

module.exports = connection;