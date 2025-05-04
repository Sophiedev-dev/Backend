const mysql = require("mysql2");

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || "ugslderxcgoxidkj",
  password: process.env.DB_PASSWORD || "yLxsYLzFcvTlMAi0iFVt",
  host: process.env.DB_HOST || "b8sxsnuwb5iwzm40xf3f-mysql.services.clever-cloud.com",
  port: process.env.DB_PORT || "3306",
  database: process.env.DB_NAME || "b8sxsnuwb5iwzm40xf3f",
};

// Create connection pool (non-promisifié)
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Successfully connected to MySQL database');
  connection.release();
});

module.exports = pool;
