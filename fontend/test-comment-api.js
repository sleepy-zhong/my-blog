const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据实际后端地址调整
const TEST_ARTICLE_ID = 1; // 测试文章ID

// 测试用户数据
const testUsers = [
  { username: 'user1', password: 'password123' },
  { username: 'user2', password: 'password123' },
  { username: 'user3', password: 'password123' }
];

let authTokens = {};

// 工具函数
async function login(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    });
    
    if (response.data.code === 0) {
      return response.data.data.token;
    } else {
      throw new Error(`登录失败: ${response.data.message}`);
    }
  } catch (error) {
    console.error(`用户 ${username} 登录失败:`, error.response?.data || error.message);
    return null;
  }
}

async function setupAuth() {
  console.log('🔐 设置测试用户认证...');
  
  for (const user of testUsers) {
    const token = await login(user.username, user.password);
    if (token) {
      authTokens[user.username] = token;
      console.log(`✅ ${user.username} 登录成功`);
    } else {
      console.log(`❌ ${user.username} 登录失败`);
    }
  }
}

// 测试函数
async function testGetCommentTree() {
  console.log('\n📋 测试获取评论树...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/comments/${TEST_ARTICLE_ID}/tree`, {
      params: { status: 'approved' }
    });
    
    console.log('✅ 获取评论树成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 验证数据结构
    if (response.data.code === 0 && Array.isArray(response.data.data)) {
      console.log(`📊 评论数量: ${response.data.data.length}`);
      
      // 检查楼中楼结构
      response.data.data.forEach((comment, index) => {
        console.log(`评论 ${index + 1}: ${comment.Content}`);
        if (comment.children && comment.children.length > 0) {
          console.log(`  └─ 子评论数量: ${comment.children.length}`);
          comment.children.forEach((child, childIndex) => {
            console.log(`    └─ 子评论 ${childIndex + 1}: ${child.Content}`);
          });
        }
      });
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取评论树失败:', error.response?.data || error.message);
    return [];
  }
}

async function testPostComment(username, content, parentId = null) {
  console.log(`\n💬 测试发表评论 (用户: ${username})...`);
  
  const token = authTokens[username];
  if (!token) {
    console.log(`❌ 用户 ${username} 未登录`);
    return null;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/comments/${TEST_ARTICLE_ID}`, {
      content,
      parentId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${username} 发表评论成功`);
      console.log('评论内容:', response.data.data.Content);
      console.log('评论ID:', response.data.data.CommentID);
      console.log('父评论ID:', response.data.data.ParentCommentID);
      console.log('状态:', response.data.data.Status);
      return response.data.data;
    } else {
      console.log(`❌ ${username} 发表评论失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${username} 发表评论失败:`, error.response?.data || error.message);
    return null;
  }
}

async function testDeleteComment(username, commentId) {
  console.log(`\n🗑️ 测试删除评论 (用户: ${username}, 评论ID: ${commentId})...`);
  
  const token = authTokens[username];
  if (!token) {
    console.log(`❌ 用户 ${username} 未登录`);
    return false;
  }
  
  try {
    const response = await axios.delete(`${BASE_URL}/api/comments/${commentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${username} 删除评论成功`);
      return true;
    } else {
      console.log(`❌ ${username} 删除评论失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${username} 删除评论失败:`, error.response?.data || error.message);
    return false;
  }
}

async function testCommentPermissions() {
  console.log('\n🔒 测试评论权限...');
  
  // 测试用户删除自己的评论
  const myComment = await testPostComment('user1', '测试删除权限的评论');
  if (myComment) {
    await testDeleteComment('user1', myComment.CommentID);
  }
  
  // 测试用户删除别人的评论（应该失败）
  const otherComment = await testPostComment('user2', '别人的评论');
  if (otherComment) {
    await testDeleteComment('user1', otherComment.CommentID);
  }
}

async function testNestedComments() {
  console.log('\n🌳 测试楼中楼评论...');
  
  // 发表主评论
  const mainComment = await testPostComment('user1', '这是一条主评论');
  if (!mainComment) return;
  
  // 回复主评论
  const reply1 = await testPostComment('user2', '回复主评论', mainComment.CommentID);
  if (!reply1) return;
  
  // 回复的回复
  const reply2 = await testPostComment('user3', '回复的回复', reply1.CommentID);
  if (!reply2) return;
  
  // 再次回复主评论
  const reply3 = await testPostComment('user1', '再次回复主评论', mainComment.CommentID);
  
  // 查看评论树结构
  console.log('\n📋 查看楼中楼结构...');
  await testGetCommentTree();
}

async function testCommentStatus() {
  console.log('\n✅ 测试评论状态...');
  
  const comment = await testPostComment('user1', '测试评论状态');
  if (comment) {
    console.log(`评论状态: ${comment.Status}`);
    if (comment.Status === 'approved') {
      console.log('✅ 评论自动审核通过');
    } else {
      console.log('❌ 评论未自动审核通过');
    }
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始评论系统测试...\n');
  
  // 1. 设置认证
  await setupAuth();
  
  // 2. 测试获取评论树
  await testGetCommentTree();
  
  // 3. 测试发表评论
  await testPostComment('user1', '这是一条测试评论');
  
  // 4. 测试楼中楼评论
  await testNestedComments();
  
  // 5. 测试评论权限
  await testCommentPermissions();
  
  // 6. 测试评论状态
  await testCommentStatus();
  
  // 7. 最终查看评论树
  console.log('\n📋 最终评论树结构...');
  await testGetCommentTree();
  
  console.log('\n🎉 测试完成！');
}

// 运行测试
runTests().catch(console.error); 