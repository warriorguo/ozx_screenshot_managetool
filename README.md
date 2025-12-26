# 截图图集管理工具

一个简单实用的截图管理工具，支持在浏览器中粘贴图片、组织项目、编辑说明文档。

## ✨ 功能特点

- 🖼️ **快速粘贴**: 支持 Ctrl+V / ⌘V 粘贴图片，或直接拖拽文件
- 📁 **项目管理**: 以项目为单位组织图片，每个项目对应一个文件夹
- 📝 **README 编辑**: 为每个项目添加 Markdown 格式的说明文档
- 🗑️ **图片删除**: 支持删除不需要的图片
- 🔄 **项目切换**: 轻松在不同项目间切换
- 💾 **本地存储**: 所有数据存储在本地文件系统，无需数据库

## 🚀 快速开始

### 1. 安装依赖

**后端依赖**:
```bash
cd backend
pip install -r requirements.txt
```

**前端依赖**:
```bash
cd frontend
npm install
```

### 2. 启动服务

**启动后端服务**:
```bash
cd backend
python -m app.main
```
后端将在 `http://localhost:8000` 运行

**启动前端服务**:
```bash
cd frontend
npm run dev
```
前端将在 `http://localhost:3000` 运行

### 3. 开始使用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"选择项目"创建或选择一个项目
3. 在粘贴区域使用 Ctrl+V 粘贴图片
4. 在 README 编辑器中为项目添加说明
5. 在右侧查看和管理你的图片集

## 📁 数据存储

所有数据存储在 `data/` 目录下，结构如下：

```
data/
  projectA/
    1.jpg
    2.jpg
    3.jpg
    README.md
  projectB/
    1.jpg
    2.jpg
    README.md
```

- 图片自动转换为 JPG 格式并按数字顺序命名
- 删除图片不会重新排序，新图片总是使用下一个可用编号
- README.md 存储项目说明（Markdown 格式）

## 🛠️ 技术架构

### 后端
- **FastAPI**: 现代、快速的 Python Web 框架
- **Pillow**: 图片处理库，支持格式转换
- **Uvicorn**: ASGI 服务器

### 前端
- **React**: 用户界面框架
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速的前端构建工具

## 🧪 测试

本项目包含完整的测试套件，确保代码质量和功能正确性。

### 后端测试

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

测试覆盖：
- 存储系统单元测试
- API 接口测试
- 并发上传测试
- 错误处理测试

### 前端测试

```bash
cd frontend
npm run test
```

测试覆盖：
- API 调用测试
- 组件渲染测试
- 用户交互测试

### 系统集成测试

完整的端到端测试：

```bash
# 在项目根目录
python test_integration.py
```

集成测试会：
- 自动启动后端服务
- 测试完整的工作流程
- 验证 API 的各种边界情况
- 自动清理测试数据

## 🔧 配置

### 后端配置

可以通过环境变量配置：

```bash
export STORAGE_DIR="/path/to/your/storage"  # 存储目录，默认为 ./data
```

### API 文档

后端启动后，访问 `http://localhost:8000/docs` 查看自动生成的 API 文档。

## 📝 使用技巧

1. **批量上传**: 可以同时粘贴或拖拽多张图片
2. **项目命名**: 项目名只能包含字母、数字、点、下划线和短横线
3. **自动保存**: README 内容会在停止输入 800ms 后自动保存
4. **格式支持**: 支持 PNG、JPG、WebP 等常见图片格式，统一保存为 JPG

## 🔒 安全性

- 严格的项目名验证，防止目录穿越攻击
- 文件大小限制（20MB）
- 只允许图片文件上传
- 本地存储，无网络安全风险

## 🐛 故障排除

1. **端口冲突**: 如果默认端口被占用，可以修改 `vite.config.ts` 和后端启动端口
2. **存储权限**: 确保后端对 `data/` 目录有读写权限
3. **图片上传失败**: 检查文件大小和格式是否符合要求

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License