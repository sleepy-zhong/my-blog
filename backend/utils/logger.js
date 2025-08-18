const { OperationLog } = require('../models');

/**
 * 记录操作日志
 * @param {Object} params 日志参数
 * @param {number} params.userId 操作用户ID
 * @param {string} params.operationType 操作类型
 * @param {string} params.targetType 操作对象类型
 * @param {number} params.targetId 操作对象ID
 * @param {Object} params.details 操作详情
 * @param {string} params.ipAddress IP地址
 * @param {string} params.userAgent 浏览器标识
 */
async function logOperation(params) {
  try {
    const {
      userId,
      operationType,
      targetType,
      targetId,
      details = {},
      ipAddress = null,
      userAgent = null
    } = params;

    await OperationLog.create({
      UserID: userId,
      OperationType: operationType,
      TargetType: targetType,
      TargetID: targetId,
      Details: details,
      IPAddress: ipAddress,
      UserAgent: userAgent,
      Timestamp: new Date()
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
    // 不抛出错误，避免影响主要业务逻辑
  }
}

/**
 * 获取客户端IP地址
 * @param {Object} req Express请求对象
 * @returns {string} IP地址
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket?.remoteAddress || 
         'unknown';
}

/**
 * 获取用户代理字符串
 * @param {Object} req Express请求对象
 * @returns {string} 用户代理字符串
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

module.exports = {
  logOperation,
  getClientIP,
  getUserAgent
}; 