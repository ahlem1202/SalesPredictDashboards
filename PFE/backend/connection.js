const { Client } = require('pg');

const db = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "khedma123",
    database: "pfe"
});

db.connect(function (error) {
    if (error) {
        console.error("Error connecting to Database:", error);
    } else {
        //console.log("Successfully connected to Database");
    }
});

module.exports = db;
