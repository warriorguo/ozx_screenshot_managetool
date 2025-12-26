import pytest
import threading
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from app.storage import ProjectStorage

class TestProjectStorage:
    def test_validate_project_name(self, test_storage):
        """Test project name validation."""
        assert test_storage.validate_project_name("valid_project-123")
        assert test_storage.validate_project_name("project.name")
        assert not test_storage.validate_project_name("../invalid")
        assert not test_storage.validate_project_name("invalid/path")
        assert not test_storage.validate_project_name("")
        assert not test_storage.validate_project_name("project..name")
        assert not test_storage.validate_project_name(".hidden")

    def test_create_project(self, test_storage, temp_dir):
        """Test project creation."""
        project_name = "test_project"
        created = test_storage.create_project(project_name)
        assert created is True
        
        project_path = temp_dir / project_name
        assert project_path.exists()
        assert project_path.is_dir()
        
        # Creating again should return False
        created_again = test_storage.create_project(project_name)
        assert created_again is False

    def test_list_projects(self, test_storage):
        """Test listing projects."""
        # Initially empty
        projects = test_storage.list_projects()
        assert projects == []
        
        # Create some projects
        test_storage.create_project("project1")
        test_storage.create_project("project2")
        
        projects = test_storage.list_projects()
        assert sorted(projects) == ["project1", "project2"]

    def test_image_numbering(self, test_storage, sample_image_data):
        """Test automatic image numbering."""
        project_name = "numbering_test"
        test_storage.create_project(project_name)
        
        # First image should be 1.jpg
        filename1 = test_storage.save_image(project_name, sample_image_data)
        assert filename1 == "1.jpg"
        
        # Second image should be 2.jpg
        filename2 = test_storage.save_image(project_name, sample_image_data)
        assert filename2 == "2.jpg"
        
        # Delete first image
        test_storage.delete_image(project_name, filename1)
        
        # Next image should be 3.jpg (not reusing 1)
        filename3 = test_storage.save_image(project_name, sample_image_data)
        assert filename3 == "3.jpg"

    def test_concurrent_image_upload(self, test_storage, sample_image_data):
        """Test concurrent image uploads to ensure no duplicate numbers."""
        project_name = "concurrent_test"
        test_storage.create_project(project_name)
        
        def upload_image():
            return test_storage.save_image(project_name, sample_image_data)
        
        # Upload 10 images concurrently
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(upload_image) for _ in range(10)]
            filenames = [future.result() for future in futures]
        
        # All filenames should be unique
        assert len(set(filenames)) == len(filenames)
        
        # Should be numbered 1.jpg through 10.jpg
        expected = {f"{i}.jpg" for i in range(1, 11)}
        assert set(filenames) == expected

    def test_list_images(self, test_storage, sample_image_data):
        """Test listing images in a project."""
        project_name = "list_test"
        test_storage.create_project(project_name)
        
        # Initially empty
        images = test_storage.list_images(project_name)
        assert images == []
        
        # Add some images
        test_storage.save_image(project_name, sample_image_data)
        test_storage.save_image(project_name, sample_image_data)
        
        images = test_storage.list_images(project_name)
        assert len(images) == 2
        assert images[0]['filename'] == '1.jpg'
        assert images[1]['filename'] == '2.jpg'
        assert all('url' in img for img in images)

    def test_delete_image(self, test_storage, sample_image_data):
        """Test image deletion."""
        project_name = "delete_test"
        test_storage.create_project(project_name)
        
        filename = test_storage.save_image(project_name, sample_image_data)
        
        # Image should exist
        assert test_storage.get_image_path(project_name, filename) is not None
        
        # Delete image
        deleted = test_storage.delete_image(project_name, filename)
        assert deleted is True
        
        # Image should no longer exist
        assert test_storage.get_image_path(project_name, filename) is None
        
        # Deleting again should return False
        deleted_again = test_storage.delete_image(project_name, filename)
        assert deleted_again is False

    def test_readme_operations(self, test_storage):
        """Test README reading and writing."""
        project_name = "readme_test"
        
        # Reading from non-existent project should return empty
        content = test_storage.read_readme(project_name)
        assert content == ""
        
        # Write README
        test_content = "# Test Project\nThis is a test."
        test_storage.write_readme(project_name, test_content)
        
        # Should create project and file
        assert test_storage.get_project_path(project_name).exists()
        
        # Read back content
        content = test_storage.read_readme(project_name)
        assert content == test_content
        
        # Update content
        updated_content = "# Updated Project\nThis is updated."
        test_storage.write_readme(project_name, updated_content)
        
        content = test_storage.read_readme(project_name)
        assert content == updated_content

    def test_image_format_conversion(self, test_storage):
        """Test that images are converted to JPEG."""
        from PIL import Image
        import io
        
        project_name = "format_test"
        test_storage.create_project(project_name)
        
        # Create a PNG image with transparency
        img = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))
        png_bytes = io.BytesIO()
        img.save(png_bytes, format='PNG')
        png_bytes.seek(0)
        
        filename = test_storage.save_image(project_name, png_bytes.getvalue())
        assert filename.endswith('.jpg')
        
        # Verify the saved image is JPEG
        image_path = test_storage.get_image_path(project_name, filename)
        with Image.open(image_path) as saved_img:
            assert saved_img.format == 'JPEG'
            assert saved_img.mode == 'RGB'  # Transparency should be removed

    def test_invalid_operations(self, test_storage):
        """Test invalid operations."""
        # Invalid project names
        with pytest.raises(ValueError):
            test_storage.get_project_path("../invalid")
        
        # Operations on non-existent projects
        assert test_storage.list_images("nonexistent") == []
        assert test_storage.get_image_path("nonexistent", "1.jpg") is None
        assert test_storage.delete_image("nonexistent", "1.jpg") is False
        
        # Invalid image filenames
        assert test_storage.get_image_path("test", "invalid.txt") is None
        assert test_storage.delete_image("test", "invalid.txt") is False