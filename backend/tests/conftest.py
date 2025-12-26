import pytest
import tempfile
import shutil
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
import os

@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    shutil.rmtree(temp_path)

@pytest.fixture
def test_storage(temp_dir):
    """Create a test storage instance with temporary directory."""
    # Create a new storage instance with custom base_dir for each test
    from app.storage import ProjectStorage
    test_storage = ProjectStorage(base_dir=temp_dir)
    yield test_storage

@pytest.fixture
def client(test_storage, monkeypatch):
    """Create a test client."""
    # Patch the storage instance in the app
    from app import main
    monkeypatch.setattr(main, 'storage', test_storage)
    return TestClient(app)

@pytest.fixture
def sample_image_data():
    """Create sample image data for testing."""
    from PIL import Image
    import io
    
    # Create a simple 100x100 red image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()