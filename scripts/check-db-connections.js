// 检查 MySQL 连接数的脚本
// 运行: node scripts/check-db-connections.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkConnections() {
  let connection;
  try {
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
    });

    // 查询当前连接数
    const [rows] = await connection.execute('SHOW STATUS WHERE Variable_name = "Threads_connected"');
    console.log('当前连接数:', rows[0].Value);

    // 查询最大连接数设置
    const [maxRows] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    console.log('最大连接数:', maxRows[0].Value);

    // 查看当前所有连接
    const [processList] = await connection.execute('SHOW PROCESSLIST');
    console.log('\n当前活跃连接列表:');
    processList.forEach(proc => {
      console.log(`- ID: ${proc.Id}, User: ${proc.User}, Host: ${proc.Host}, DB: ${proc.db}, Command: ${proc.Command}, Time: ${proc.Time}`);
    });

  } catch (error) {
    console.error('检查连接时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkConnections();
