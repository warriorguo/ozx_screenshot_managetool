@echo off
chcp 65001 >nul
echo 🚀 启动截图管理工具...

REM 检查是否安装了 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Python，请先安装 Python
    pause
    exit /b 1
)

REM 检查是否安装了 Node.js
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

REM 创建数据目录
if not exist data mkdir data
echo 📁 创建数据目录: data\

REM 安装后端依赖
echo 📦 安装后端依赖...
cd backend
if not exist venv (
    echo 创建虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt

REM 安装前端依赖
echo 📦 安装前端依赖...
cd ..\frontend
if not exist node_modules (
    npm install
)

echo.
echo ✅ 依赖安装完成！
echo 🔗 请分别在两个终端中运行以下命令：
echo.
echo 终端1 (后端服务):
echo cd backend ^&^& venv\Scripts\activate ^&^& python -m app.main
echo.
echo 终端2 (前端服务):
echo cd frontend ^&^& npm run dev
echo.
echo 💡 启动后访问: http://localhost:3000
pause