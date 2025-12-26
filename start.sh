#!/bin/bash

# 截图管理工具启动脚本

echo "🚀 启动截图管理工具..."

# 检查是否安装了 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python"
    exit 1
fi

# 检查是否安装了 Node.js
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 Node.js"
    exit 1
fi

# 创建数据目录
mkdir -p data
echo "📁 创建数据目录: data/"

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 启动后端
echo "🖥️ 启动后端服务..."
cd ../backend
source venv/bin/activate
python -m app.main &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "🌐 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo "🔗 前端地址: http://localhost:3000"
echo "🔗 后端地址: http://localhost:8000"
echo "📖 API 文档: http://localhost:8000/docs"
echo ""
echo "💡 按 Ctrl+C 退出服务"

# 等待用户中断
trap "echo '🛑 正在关闭服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait