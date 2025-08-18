require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupVerificationTable() {
  console.log('🗑️ 开始清理邮箱验证码数据表...');
  
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'techblogdb'
    });

    console.log('✅ 数据库连接成功');

    // 检查表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'verificationcodes'"
    );

    if (tables.length > 0) {
      // 获取表中的记录数
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM verificationcodes'
      );
      const recordCount = countResult[0].count;
      
      console.log(`📊 找到 ${recordCount} 条验证码记录`);
      
      if (recordCount > 0) {
        // 删除表数据
        await connection.execute('DELETE FROM verificationcodes');
        console.log('✅ 已清空验证码表数据');
      }
      
      // 删除表结构
      await connection.execute('DROP TABLE verificationcodes');
      console.log('✅ 已删除 verificationcodes 表');
    } else {
      console.log('ℹ️ verificationcodes 表不存在，无需清理');
    }

    await connection.end();
    console.log('✅ 验证码数据表清理完成！');
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 执行清理
cleanupVerificationTable();
