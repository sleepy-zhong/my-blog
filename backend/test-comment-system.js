const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// 测试用户登录获取token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ 登录成功，获取到token');
    return authToken;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试创建评论
async function testCreateComment(articleId = 1) {
  try {
    console.log('\n📝 测试创建评论...');
    
    // 创建主评论
    const mainComment = await axios.post(`${BASE_URL}/comments/${articleId}`, {
      content: '这是一条主评论'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ 主评论创建成功:', mainComment.data.data.CommentID);
    
    // 创建回复评论
    const replyComment = await axios.post(`${BASE_URL}/comments/${articleId}`, {
      content: '这是回复评论',
      parentId: mainComment.data.data.CommentID
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ 回复评论创建成功:', replyComment.data.data.CommentID);
    
    return {
      mainCommentId: mainComment.data.data.CommentID,
      replyCommentId: replyComment.data.data.CommentID
    };
  } catch (error) {
    console.error('❌ 创建评论失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试获取评论树
async function testGetCommentTree(articleId = 1) {
  try {
    console.log('\n🌳 测试获取评论树...');
    
    const response = await axios.get(`${BASE_URL}/comments/${articleId}/tree`, {
      params: {
        status: 'approved',
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('✅ 评论树获取成功');
    console.log('📊 响应结构:', {
      code: response.data.code,
      message: response.data.message,
      dataLength: response.data.data.length,
      pagination: response.data.pagination
    });
    
    // 检查树结构
    if (response.data.data.length > 0) {
      const firstComment = response.data.data[0];
      console.log('🌿 第一条评论:', {
        CommentID: firstComment.CommentID,
        Content: firstComment.Content,
        childrenCount: firstComment.children?.length || 0,
        User: firstComment.User?.DisplayName
      });
      
      if (firstComment.children && firstComment.children.length > 0) {
        console.log('👶 子评论:', firstComment.children[0].Content);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取评论树失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试获取平铺评论列表
async function testGetCommentsList(articleId = 1) {
  try {
    console.log('\n📋 测试获取评论列表...');
    
    const response = await axios.get(`${BASE_URL}/comments/${articleId}`, {
      params: {
        page: 1,
        pageSize: 10,
        status: 'approved'
      }
    });
    
    console.log('✅ 评论列表获取成功');
    console.log('📊 响应结构:', {
      code: response.data.code,
      total: response.data.data.total,
      listLength: response.data.data.list.length
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取评论列表失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试删除评论
async function testDeleteComment(commentId) {
  try {
    console.log('\n🗑️ 测试删除评论...');
    
    const response = await axios.delete(`${BASE_URL}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ 评论删除成功:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ 删除评论失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试更新评论状态
async function testUpdateCommentStatus(commentId) {
  try {
    console.log('\n🔄 测试更新评论状态...');
    
    const response = await axios.put(`${BASE_URL}/comments/${commentId}/status`, {
      status: 'spam'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ 评论状态更新成功:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ 更新评论状态失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试获取所有评论（管理员）
async function testGetAllComments() {
  try {
    console.log('\n👨‍💼 测试获取所有评论（管理员）...');
    
    const response = await axios.get(`${BASE_URL}/comments`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        pageSize: 5,
        status: 'approved'
      }
    });
    
    console.log('✅ 所有评论获取成功');
    console.log('📊 响应结构:', {
      code: response.data.code,
      total: response.data.data.total,
      listLength: response.data.data.list.length
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取所有评论失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('🚀 开始评论系统测试...\n');
    
    // 1. 登录
    await login();
    
    // 2. 创建评论
    const { mainCommentId, replyCommentId } = await testCreateComment();
    
    // 3. 获取评论树
    await testGetCommentTree();
    
    // 4. 获取评论列表
    await testGetCommentsList();
    
    // 5. 更新评论状态
    await testUpdateCommentStatus(mainCommentId);
    
    // 6. 获取所有评论
    await testGetAllComments();
    
    // 7. 删除评论（会级联删除子评论）
    await testDeleteComment(mainCommentId);
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  login,
  testCreateComment,
  testGetCommentTree,
  testGetCommentsList,
  testDeleteComment,
  testUpdateCommentStatus,
  testGetAllComments
}; 