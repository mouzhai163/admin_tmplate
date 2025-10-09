// 清理空闲 MySQL 连接的脚本
// 运行: node scripts/kill-idle-connections.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function killIdleConnections() {
  let connection;
  try {
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
    });

    // 获取当前所有连接
    const [processList] = await connection.execute('SHOW PROCESSLIST');
    
    let killedCount = 0;
    for (const proc of processList) {
      // 只清理空闲超过 10 秒的连接（排除当前连接）
      if (proc.Command === 'Sleep' && proc.Time > 10 && proc.Id !== connection.threadId) {
        try {
          await connection.execute(`KILL ${proc.Id}`);
          console.log(`已终止连接 ID: ${proc.Id} (空闲时间: ${proc.Time}秒)`);
          killedCount++;
        } catch (err) {
          console.error(`无法终止连接 ID ${proc.Id}:`, err.message);
        }
      }
    }

    console.log(`\n总共清理了 ${killedCount} 个空闲连接`);

    // 显示清理后的状态
    const [status] = await connection.execute('SHOW STATUS WHERE Variable_name = "Threads_connected"');
    console.log('当前剩余连接数:', status[0].Value);

  } catch (error) {
    console.error('清理连接时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

killIdleConnections();
