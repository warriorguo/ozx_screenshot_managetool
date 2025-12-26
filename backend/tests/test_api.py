import pytest
import io
from PIL import Image

class TestProjectAPI:
    def test_list_projects_empty(self, client):
        """Test listing projects when none exist."""
        response = client.get("/api/projects")
        assert response.status_code == 200
        assert response.json() == {"projects": []}

    def test_create_project(self, client):
        """Test creating a new project."""
        response = client.post("/api/projects", json={"name": "test_project"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test_project"
        assert data["created"] is True

    def test_create_project_idempotent(self, client):
        """Test that creating the same project twice is idempotent."""
        # Create first time
        response = client.post("/api/projects", json={"name": "test_project"})
        assert response.status_code == 200
        assert response.json()["created"] is True
        
        # Create second time
        response = client.post("/api/projects", json={"name": "test_project"})
        assert response.status_code == 200
        assert response.json()["created"] is False

    def test_create_project_invalid_name(self, client):
        """Test creating project with invalid name."""
        response = client.post("/api/projects", json={"name": "../invalid"})
        assert response.status_code == 400
        assert "Invalid project name" in response.json()["detail"]

    def test_list_projects_with_data(self, client):
        """Test listing projects after creating some."""
        # Create projects
        client.post("/api/projects", json={"name": "project1"})
        client.post("/api/projects", json={"name": "project2"})
        
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert sorted(data["projects"]) == ["project1", "project2"]

    def test_get_project_detail_not_found(self, client):
        """Test getting details of non-existent project."""
        response = client.get("/api/projects/nonexistent")
        assert response.status_code == 404

    def test_get_project_detail_empty(self, client):
        """Test getting details of empty project."""
        # Create project
        client.post("/api/projects", json={"name": "empty_project"})
        
        response = client.get("/api/projects/empty_project")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "empty_project"
        assert data["images"] == []
        assert data["readme"] == ""

class TestImageAPI:
    def test_upload_image(self, client, sample_image_data):
        """Test uploading an image."""
        # Create project first
        client.post("/api/projects", json={"name": "image_test"})
        
        files = {"file": ("test.png", io.BytesIO(sample_image_data), "image/png")}
        response = client.post("/api/projects/image_test/images", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "1.jpg"
        assert "/api/projects/image_test/images/1.jpg" in data["url"]

    def test_upload_multiple_images(self, client, sample_image_data):
        """Test uploading multiple images."""
        # Create project first
        client.post("/api/projects", json={"name": "multi_test"})
        
        # Upload first image
        files = {"file": ("test1.png", io.BytesIO(sample_image_data), "image/png")}
        response1 = client.post("/api/projects/multi_test/images", files=files)
        assert response1.json()["filename"] == "1.jpg"
        
        # Upload second image
        files = {"file": ("test2.png", io.BytesIO(sample_image_data), "image/png")}
        response2 = client.post("/api/projects/multi_test/images", files=files)
        assert response2.json()["filename"] == "2.jpg"

    def test_upload_to_invalid_project(self, client, sample_image_data):
        """Test uploading to project with invalid name."""
        files = {"file": ("test.png", io.BytesIO(sample_image_data), "image/png")}
        # Test with project name that contains invalid characters but reaches our validation
        response = client.post("/api/projects/.hidden/images", files=files)
        assert response.status_code == 400

    def test_upload_non_image(self, client):
        """Test uploading non-image file."""
        client.post("/api/projects", json={"name": "upload_test"})
        
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        response = client.post("/api/projects/upload_test/images", files=files)
        assert response.status_code == 400
        assert "File must be an image" in response.json()["detail"]

    def test_upload_large_file(self, client):
        """Test uploading file that exceeds size limit."""
        client.post("/api/projects", json={"name": "large_test"})
        
        # Create large file (simulate file larger than 20MB)
        large_data = b"x" * (21 * 1024 * 1024)  # 21MB
        files = {"file": ("large.png", io.BytesIO(large_data), "image/png")}
        response = client.post("/api/projects/large_test/images", files=files)
        assert response.status_code == 413
        assert "File too large" in response.json()["detail"]

    def test_get_image(self, client, sample_image_data):
        """Test retrieving an image."""
        # Create project and upload image
        client.post("/api/projects", json={"name": "get_test"})
        files = {"file": ("test.png", io.BytesIO(sample_image_data), "image/png")}
        client.post("/api/projects/get_test/images", files=files)
        
        # Get image
        response = client.get("/api/projects/get_test/images/1.jpg")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"

    def test_get_nonexistent_image(self, client):
        """Test retrieving non-existent image."""
        client.post("/api/projects", json={"name": "get_test"})
        
        response = client.get("/api/projects/get_test/images/999.jpg")
        assert response.status_code == 404

    def test_delete_image(self, client, sample_image_data):
        """Test deleting an image."""
        # Create project and upload image
        client.post("/api/projects", json={"name": "delete_test"})
        files = {"file": ("test.png", io.BytesIO(sample_image_data), "image/png")}
        client.post("/api/projects/delete_test/images", files=files)
        
        # Delete image
        response = client.delete("/api/projects/delete_test/images/1.jpg")
        assert response.status_code == 200
        assert response.json()["deleted"] is True
        
        # Verify image is gone
        response = client.get("/api/projects/delete_test/images/1.jpg")
        assert response.status_code == 404

    def test_delete_nonexistent_image(self, client):
        """Test deleting non-existent image."""
        client.post("/api/projects", json={"name": "delete_test"})
        
        response = client.delete("/api/projects/delete_test/images/999.jpg")
        assert response.status_code == 404

    def test_project_with_images(self, client, sample_image_data):
        """Test getting project details with images."""
        # Create project and upload images
        client.post("/api/projects", json={"name": "full_test"})
        
        files = {"file": ("test1.png", io.BytesIO(sample_image_data), "image/png")}
        client.post("/api/projects/full_test/images", files=files)
        
        files = {"file": ("test2.png", io.BytesIO(sample_image_data), "image/png")}
        client.post("/api/projects/full_test/images", files=files)
        
        # Get project details
        response = client.get("/api/projects/full_test")
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) == 2
        assert data["images"][0]["filename"] == "1.jpg"
        assert data["images"][1]["filename"] == "2.jpg"

class TestReadmeAPI:
    def test_get_readme_empty(self, client):
        """Test getting README for project without one."""
        client.post("/api/projects", json={"name": "readme_test"})
        
        response = client.get("/api/projects/readme_test/readme")
        assert response.status_code == 200
        assert response.json()["content"] == ""

    def test_update_readme(self, client):
        """Test updating README content."""
        client.post("/api/projects", json={"name": "readme_test"})
        
        content = "# Test Project\nThis is a test project."
        response = client.put("/api/projects/readme_test/readme", 
                            json={"content": content})
        assert response.status_code == 200
        assert response.json()["content"] == content

    def test_get_updated_readme(self, client):
        """Test getting updated README content."""
        client.post("/api/projects", json={"name": "readme_test"})
        
        # Update README
        content = "# Test Project\nThis is a test project."
        client.put("/api/projects/readme_test/readme", json={"content": content})
        
        # Get README
        response = client.get("/api/projects/readme_test/readme")
        assert response.status_code == 200
        assert response.json()["content"] == content

    def test_readme_operations_invalid_project(self, client):
        """Test README operations on invalid project."""
        response = client.get("/api/projects/.hidden/readme")
        assert response.status_code == 400
        
        response = client.put("/api/projects/.hidden/readme", 
                            json={"content": "test"})
        assert response.status_code == 400

    def test_readme_nonexistent_project(self, client):
        """Test getting README for non-existent project."""
        response = client.get("/api/projects/nonexistent/readme")
        assert response.status_code == 404