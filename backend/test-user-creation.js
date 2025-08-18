const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234root', // 请修改为你的实际MySQL密码
  database: 'techblogdb'
};

async function testUserCreation() {
  let connection;
  
  try {
    console.log('🔧 测试用户创建...\n');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查数据库表结构
    console.log('\n📋 检查用户表结构...');
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('用户表字段:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 2. 检查现有用户
    console.log('\n👥 检查现有用户...');
    const [users] = await connection.execute('SELECT UserID, Username, Email, DisplayName FROM users');
    console.log(`找到 ${users.length} 个用户`);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`- ID: ${user.UserID}, ${user.Email} (${user.DisplayName})`);
      });
    }
    
    // 3. 检查角色表
    console.log('\n🎭 检查角色表...');
    const [roles] = await connection.execute('SELECT RoleID, Name, Description FROM roles');
    console.log(`找到 ${roles.length} 个角色`);
    
    roles.forEach(role => {
      console.log(`- ID: ${role.RoleID}, ${role.Name}: ${role.Description}`);
    });
    
    // 4. 尝试创建测试用户
    console.log('\n➕ 创建测试用户...');
    
    // 检查admin用户是否存在
    const [existingAdmin] = await connection.execute(
      'SELECT UserID FROM users WHERE Email = ?', 
      ['admin@example.com']
    );
    
    if (existingAdmin.length === 0) {
      // 创建admin用户
      const [result] = await connection.execute(`
        INSERT INTO users (Username, Email, PasswordHash, DisplayName, CreatedAt) 
        VALUES (?, ?, ?, ?, NOW())
      `, [
        'admin',
        'admin@example.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
        '管理员'
      ]);
      
      console.log(`✅ admin用户创建成功，ID: ${result.insertId}`);
      
      // 分配admin角色
      const adminRole = roles.find(r => r.Name === 'admin');
      if (adminRole) {
        await connection.execute(`
          INSERT INTO userroles (UserID, RoleID) VALUES (?, ?)
        `, [result.insertId, adminRole.RoleID]);
        console.log(`✅ 已分配admin角色`);
      }
    } else {
      console.log('⏭️ admin用户已存在');
    }
    
    // 5. 验证用户创建
    console.log('\n📊 验证用户创建结果...');
    const [finalUsers] = await connection.execute(`
      SELECT 
        u.UserID, 
        u.Username, 
        u.Email, 
        u.DisplayName,
        GROUP_CONCAT(r.Name) as Roles
      FROM users u
      LEFT JOIN userroles ur ON u.UserID = ur.UserID
      LEFT JOIN roles r ON ur.RoleID = r.RoleID
      WHERE u.Email = 'admin@example.com'
      GROUP BY u.UserID
    `);
    
    if (finalUsers.length > 0) {
      const user = finalUsers[0];
      console.log(`✅ 用户验证成功:`);
      console.log(`- ID: ${user.UserID}`);
      console.log(`- 邮箱: ${user.Email}`);
      console.log(`- 用户名: ${user.Username}`);
      console.log(`- 显示名: ${user.DisplayName}`);
      console.log(`- 角色: ${user.Roles || '无'}`);
    }
    
    // 6. 测试登录信息
    console.log('\n🔑 测试登录信息:');
    console.log('邮箱: admin@example.com');
    console.log('密码: admin123');
    
    console.log('\n🎉 用户创建测试完成！');
    console.log('\n🚀 现在可以运行测试:');
    console.log('node test-comment-system.js');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 请检查数据库配置:');
      console.log('- 用户名和密码是否正确');
      console.log('- 数据库是否存在');
      console.log('- 用户是否有足够权限');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 请检查数据库表是否存在');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
if (require.main === module) {
  testUserCreation();
}

module.exports = { testUserCreation }; 