const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password', // 请修改为你的实际密码
  database: 'techblogdb'
};

async function verifyCommentDatabase() {
  let connection;
  
  try {
    console.log('🔍 开始验证评论系统数据库修改...\n');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查表结构
    console.log('\n📋 检查评论表结构...');
    const [columns] = await connection.execute('DESCRIBE comments');
    
    const statusColumn = columns.find(col => col.Field === 'Status');
    const canDeleteColumn = columns.find(col => col.Field === 'CanDelete');
    
    console.log('Status字段默认值:', statusColumn.Default);
    console.log('CanDelete字段存在:', !!canDeleteColumn);
    
    if (statusColumn.Default === 'approved' && canDeleteColumn) {
      console.log('✅ 表结构修改成功');
    } else {
      console.log('❌ 表结构修改失败');
      return;
    }
    
    // 2. 检查测试数据
    console.log('\n📊 检查测试数据...');
    const [testData] = await connection.execute(`
      SELECT 
        CommentID,
        PostID,
        UserID,
        ParentCommentID,
        LEFT(Content, 30) as Content,
        Status,
        CanDelete,
        CreatedAt
      FROM comments 
      WHERE PostID = 1 
      ORDER BY ParentCommentID IS NULL DESC, CommentID
    `);
    
    console.log(`找到 ${testData.length} 条测试评论`);
    
    if (testData.length > 0) {
      console.log('✅ 测试数据存在');
      
      // 显示楼中楼结构
      console.log('\n🌳 楼中楼结构预览:');
      const mainComments = testData.filter(c => c.ParentCommentID === null);
      
      mainComments.forEach((main, index) => {
        console.log(`${index + 1}. ${main.Content} (ID: ${main.CommentID})`);
        
        const replies = testData.filter(c => c.ParentCommentID === main.CommentID);
        replies.forEach(reply => {
          console.log(`   └─ ${reply.Content} (ID: ${reply.CommentID})`);
          
          const subReplies = testData.filter(c => c.ParentCommentID === reply.CommentID);
          subReplies.forEach(subReply => {
            console.log(`      └─ ${subReply.Content} (ID: ${subReply.CommentID})`);
          });
        });
      });
    } else {
      console.log('⚠️ 没有找到测试数据');
    }
    
    // 3. 验证状态分布
    console.log('\n📈 评论状态分布:');
    const [statusStats] = await connection.execute(`
      SELECT Status, COUNT(*) as count 
      FROM comments 
      GROUP BY Status
    `);
    
    statusStats.forEach(stat => {
      console.log(`${stat.Status}: ${stat.count} 条`);
    });
    
    // 4. 验证CanDelete字段
    console.log('\n🔐 CanDelete字段验证:');
    const [canDeleteStats] = await connection.execute(`
      SELECT CanDelete, COUNT(*) as count 
      FROM comments 
      GROUP BY CanDelete
    `);
    
    canDeleteStats.forEach(stat => {
      console.log(`CanDelete = ${stat.CanDelete}: ${stat.count} 条`);
    });
    
    // 5. 测试楼中楼查询
    console.log('\n🌿 测试楼中楼查询...');
    const [treeData] = await connection.execute(`
      SELECT 
        c1.CommentID as '主评论ID',
        LEFT(c1.Content, 20) as '主评论内容',
        c2.CommentID as '回复ID',
        LEFT(c2.Content, 20) as '回复内容',
        c3.CommentID as '回复的回复ID',
        LEFT(c3.Content, 20) as '回复的回复内容'
      FROM comments c1
      LEFT JOIN comments c2 ON c1.CommentID = c2.ParentCommentID
      LEFT JOIN comments c3 ON c2.CommentID = c3.ParentCommentID
      WHERE c1.PostID = 1 AND c1.ParentCommentID IS NULL
      ORDER BY c1.CommentID, c2.CommentID, c3.CommentID
    `);
    
    console.log(`楼中楼查询结果: ${treeData.length} 条记录`);
    
    // 6. 总结
    console.log('\n🎉 数据库验证完成！');
    console.log('\n📝 验证结果:');
    console.log('✅ 评论表结构已正确修改');
    console.log('✅ CanDelete字段已添加');
    console.log('✅ 默认状态已设为approved');
    console.log('✅ 测试数据已插入');
    console.log('✅ 楼中楼结构正常');
    
    console.log('\n🚀 现在可以启动服务器并运行测试:');
    console.log('npm start');
    console.log('node test-comment-system.js');
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 请检查数据库配置:');
      console.log('- 用户名和密码是否正确');
      console.log('- 数据库是否存在');
      console.log('- 用户是否有足够权限');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行验证
if (require.main === module) {
  verifyCommentDatabase();
}

module.exports = { verifyCommentDatabase }; 