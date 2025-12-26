#!/usr/bin/env python3
"""
系统集成测试脚本
测试后端API的完整工作流程
"""

import requests
import tempfile
import shutil
from pathlib import Path
import io
from PIL import Image
import time
import subprocess
import signal
import os

class IntegrationTest:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.server_process = None
        self.temp_data_dir = None
        
    def setup(self):
        """启动测试环境"""
        print("🔧 设置测试环境...")
        
        # 创建临时数据目录
        self.temp_data_dir = Path(tempfile.mkdtemp())
        print(f"📁 临时数据目录: {self.temp_data_dir}")
        
        # 设置环境变量
        env = os.environ.copy()
        env['STORAGE_DIR'] = str(self.temp_data_dir)
        
        # 启动后端服务
        print("🚀 启动后端服务...")
        backend_path = Path(__file__).parent / 'backend'
        self.server_process = subprocess.Popen(
            ['python', '-m', 'app.main'],
            cwd=backend_path,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # 等待服务启动
        for _ in range(30):  # 最多等待30秒
            try:
                response = requests.get(f"{self.base_url}/docs", timeout=1)
                if response.status_code == 200:
                    print("✅ 后端服务启动成功")
                    return
            except requests.exceptions.RequestException:
                time.sleep(1)
        
        raise Exception("❌ 后端服务启动失败")
    
    def teardown(self):
        """清理测试环境"""
        print("🧹 清理测试环境...")
        
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait(timeout=10)
            print("🛑 后端服务已停止")
        
        if self.temp_data_dir and self.temp_data_dir.exists():
            shutil.rmtree(self.temp_data_dir)
            print("🗑️ 临时数据已清理")
    
    def create_test_image(self, color='red', size=(100, 100)):
        """创建测试图片"""
        img = Image.new('RGB', size, color=color)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        return img_bytes
    
    def test_complete_workflow(self):
        """测试完整工作流程"""
        print("\n🧪 开始完整工作流程测试...")
        
        # 1. 列出项目（应该为空）
        print("1️⃣ 测试列出项目...")
        response = requests.get(f"{self.base_url}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert data['projects'] == []
        print("✅ 初始项目列表为空")
        
        # 2. 创建项目
        print("2️⃣ 测试创建项目...")
        response = requests.post(f"{self.base_url}/api/projects", json={"name": "test-project"})
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'test-project'
        assert data['created'] is True
        print("✅ 项目创建成功")
        
        # 3. 再次列出项目
        print("3️⃣ 测试项目已创建...")
        response = requests.get(f"{self.base_url}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert data['projects'] == ['test-project']
        print("✅ 项目出现在列表中")
        
        # 4. 获取项目详情（空）
        print("4️⃣ 测试获取空项目详情...")
        response = requests.get(f"{self.base_url}/api/projects/test-project")
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'test-project'
        assert data['images'] == []
        assert data['readme'] == ''
        print("✅ 空项目详情正确")
        
        # 5. 上传图片
        print("5️⃣ 测试上传图片...")
        img1 = self.create_test_image('red')
        files = {'file': ('test1.png', img1, 'image/png')}
        response = requests.post(f"{self.base_url}/api/projects/test-project/images", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data['filename'] == '1.jpg'
        assert 'test-project/images/1.jpg' in data['url']
        print("✅ 第一张图片上传成功")
        
        img2 = self.create_test_image('blue')
        files = {'file': ('test2.png', img2, 'image/png')}
        response = requests.post(f"{self.base_url}/api/projects/test-project/images", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data['filename'] == '2.jpg'
        print("✅ 第二张图片上传成功")
        
        # 6. 获取图片
        print("6️⃣ 测试获取图片...")
        response = requests.get(f"{self.base_url}/api/projects/test-project/images/1.jpg")
        assert response.status_code == 200
        assert response.headers['content-type'] == 'image/jpeg'
        print("✅ 图片获取成功")
        
        # 7. 获取项目详情（有图片）
        print("7️⃣ 测试获取包含图片的项目详情...")
        response = requests.get(f"{self.base_url}/api/projects/test-project")
        assert response.status_code == 200
        data = response.json()
        assert len(data['images']) == 2
        assert data['images'][0]['filename'] == '1.jpg'
        assert data['images'][1]['filename'] == '2.jpg'
        print("✅ 项目详情包含所有图片")
        
        # 8. 更新README
        print("8️⃣ 测试更新README...")
        readme_content = "# 测试项目\n这是一个测试项目，包含一些测试图片。"
        response = requests.put(f"{self.base_url}/api/projects/test-project/readme", 
                              json={"content": readme_content})
        assert response.status_code == 200
        data = response.json()
        assert data['content'] == readme_content
        print("✅ README更新成功")
        
        # 9. 获取README
        print("9️⃣ 测试获取README...")
        response = requests.get(f"{self.base_url}/api/projects/test-project/readme")
        assert response.status_code == 200
        data = response.json()
        assert data['content'] == readme_content
        print("✅ README读取成功")
        
        # 10. 删除图片
        print("🔟 测试删除图片...")
        response = requests.delete(f"{self.base_url}/api/projects/test-project/images/1.jpg")
        assert response.status_code == 200
        data = response.json()
        assert data['deleted'] is True
        print("✅ 图片删除成功")
        
        # 11. 验证图片已删除
        print("1️⃣1️⃣ 验证图片已删除...")
        response = requests.get(f"{self.base_url}/api/projects/test-project/images/1.jpg")
        assert response.status_code == 404
        print("✅ 已删除的图片无法访问")
        
        response = requests.get(f"{self.base_url}/api/projects/test-project")
        assert response.status_code == 200
        data = response.json()
        assert len(data['images']) == 1
        assert data['images'][0]['filename'] == '2.jpg'
        print("✅ 项目详情已更新")
        
        # 12. 测试新图片编号
        print("1️⃣2️⃣ 测试删除后的新图片编号...")
        img3 = self.create_test_image('green')
        files = {'file': ('test3.png', img3, 'image/png')}
        response = requests.post(f"{self.base_url}/api/projects/test-project/images", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data['filename'] == '3.jpg'  # 应该是3，不是1
        print("✅ 新图片编号正确（不重用已删除的编号）")
        
    def test_error_cases(self):
        """测试错误情况"""
        print("\n🚨 开始错误情况测试...")
        
        # 1. 无效项目名
        print("1️⃣ 测试无效项目名...")
        response = requests.post(f"{self.base_url}/api/projects", json={"name": ".hidden"})
        assert response.status_code == 400
        print("✅ 无效项目名被拒绝")
        
        # 2. 不存在的项目
        print("2️⃣ 测试访问不存在的项目...")
        response = requests.get(f"{self.base_url}/api/projects/nonexistent")
        assert response.status_code == 404
        print("✅ 不存在的项目返回404")
        
        # 3. 上传非图片文件
        print("3️⃣ 测试上传非图片文件...")
        response = requests.post(f"{self.base_url}/api/projects", json={"name": "upload-test"})
        assert response.status_code == 200
        
        files = {'file': ('test.txt', io.StringIO('not an image'), 'text/plain')}
        response = requests.post(f"{self.base_url}/api/projects/upload-test/images", files=files)
        assert response.status_code == 400
        print("✅ 非图片文件被拒绝")
        
        # 4. 删除不存在的图片
        print("4️⃣ 测试删除不存在的图片...")
        response = requests.delete(f"{self.base_url}/api/projects/upload-test/images/999.jpg")
        assert response.status_code == 404
        print("✅ 删除不存在的图片返回404")
        
    def run_all_tests(self):
        """运行所有测试"""
        try:
            self.setup()
            self.test_complete_workflow()
            self.test_error_cases()
            print("\n🎉 所有集成测试通过！")
            return True
        except Exception as e:
            print(f"\n💥 测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.teardown()

if __name__ == "__main__":
    test = IntegrationTest()
    success = test.run_all_tests()
    exit(0 if success else 1)