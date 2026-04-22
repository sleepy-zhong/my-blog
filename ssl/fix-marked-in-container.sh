#!/bin/bash

# ===========================================
# 直接在容器内修复 marked 问题
# ===========================================

set -e

echo "==================================="
echo "🔧 直接在容器内修复 marked 问题"
echo "📅 时间: $(date)"
echo "==================================="

# 停止后端容器
echo "🛑 停止后端容器..."
docker-compose -f docker-compose.ultra-low.yml stop backend

# 检查当前 marked 版本并直接修复
echo "📝 在容器内检查并修复 marked..."
docker-compose -f docker-compose.ultra-low.yml run --rm backend sh -c "
    echo '当前 marked 版本:'
    npm list marked || echo 'marked 未安装或版本问题'
    
    echo '删除 node_modules 和 package-lock.json...'
    rm -rf node_modules package-lock.json
    
    echo '修改 package.json...'
    sed -i 's/\"marked\": \"[^\"]*\"/\"marked\": \"4.3.0\"/' package.json
    
    echo '重新安装依赖...'
    npm install
    
    echo '验证 marked 版本:'
    npm list marked
    
    echo '检查 articleController.js 中的 marked 导入:'
    grep -n 'marked' /app/controllers/articleController.js || echo '未找到 marked 引用'
"

echo "🚀 重新构建并启动后端..."
docker-compose -f docker-compose.ultra-low.yml build --no-cache backend
docker-compose -f docker-compose.ultra-low.yml up -d backend

# 等待启动
echo "⏱️ 等待后端启动 (60秒)..."
for i in {1..60}; do
    if docker-compose -f docker-compose.ultra-low.yml ps backend | grep -q "Up"; then
        echo "✅ 后端已启动"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 检查状态
echo "🔍 检查后端状态..."
docker-compose -f docker-compose.ultra-low.yml ps

# 等待服务完全启动
echo "⏳ 等待服务完全启动..."
sleep 10

# 查看最新日志
echo "📋 查看后端最新日志..."
docker-compose -f docker-compose.ultra-low.yml logs --tail=30 backend

# 测试连接
echo "🩺 测试后端连接..."
sleep 5
if curl -s -f http://localhost:3000/api-docs > /dev/null 2>&1; then
    echo "✅ 后端连接成功!"
    echo "🌐 API文档可访问: http://localhost:3000/api-docs"
else
    echo "❌ 后端仍无响应，检查详细日志..."
    docker-compose -f docker-compose.ultra-low.yml logs backend | tail -50
fi

# 在运行的容器中验证
echo "🔍 在运行容器中验证修复..."
docker-compose -f docker-compose.ultra-low.yml exec backend sh -c "
    echo 'package.json 中的 marked 版本:'
    grep marked package.json
    echo 'node_modules 中的 marked 版本:'
    npm list marked 2>/dev/null || echo 'marked 模块检查失败'
" 2>/dev/null || echo "容器可能正在重启，跳过验证"

echo "==================================="
echo "🎯 修复完成!"
echo "==================================="
