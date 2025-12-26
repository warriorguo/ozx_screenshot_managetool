import os
import re
import threading
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
import io

from .config import BASE_DIR

class ProjectStorage:
    def __init__(self, base_dir=None):
        self._locks: Dict[str, threading.Lock] = {}
        self._lock = threading.Lock()
        self._base_dir = Path(base_dir) if base_dir else BASE_DIR
    
    def _get_project_lock(self, project_name: str) -> threading.Lock:
        with self._lock:
            if project_name not in self._locks:
                self._locks[project_name] = threading.Lock()
            return self._locks[project_name]
    
    def validate_project_name(self, name: str) -> bool:
        """Validate project name to prevent directory traversal."""
        if not name or not re.match(r'^[A-Za-z0-9._-]+$', name):
            return False
        if '..' in name or name.startswith('.'):
            return False
        return True
    
    def get_project_path(self, project_name: str) -> Path:
        """Get the full path to a project directory."""
        if not self.validate_project_name(project_name):
            raise ValueError(f"Invalid project name: {project_name}")
        return self._base_dir / project_name
    
    def list_projects(self) -> List[str]:
        """List all existing projects."""
        if not self._base_dir.exists():
            return []
        
        projects = []
        for item in self._base_dir.iterdir():
            if item.is_dir() and self.validate_project_name(item.name):
                projects.append(item.name)
        return sorted(projects)
    
    def create_project(self, project_name: str) -> bool:
        """Create a project directory if it doesn't exist."""
        project_path = self.get_project_path(project_name)
        created = not project_path.exists()
        project_path.mkdir(parents=True, exist_ok=True)
        return created
    
    def get_next_image_number(self, project_name: str) -> int:
        """Get the next available image number for a project."""
        project_path = self.get_project_path(project_name)
        if not project_path.exists():
            return 1
        
        max_num = 0
        for file_path in project_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() == '.jpg':
                match = re.match(r'^(\d+)\.jpg$', file_path.name)
                if match:
                    num = int(match.group(1))
                    max_num = max(max_num, num)
        
        return max_num + 1
    
    def save_image(self, project_name: str, image_data: bytes) -> str:
        """Save an image to a project with automatic numbering."""
        project_lock = self._get_project_lock(project_name)
        
        with project_lock:
            # Ensure project exists
            self.create_project(project_name)
            
            # Get next number
            next_num = self.get_next_image_number(project_name)
            filename = f"{next_num}.jpg"
            
            # Convert and save as JPEG
            image = Image.open(io.BytesIO(image_data))
            if image.mode in ('RGBA', 'P'):
                # Convert to RGB for JPEG
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = rgb_image
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            file_path = self.get_project_path(project_name) / filename
            image.save(file_path, 'JPEG', quality=90)
            
            return filename
    
    def list_images(self, project_name: str) -> List[Dict[str, str]]:
        """List all images in a project."""
        project_path = self.get_project_path(project_name)
        if not project_path.exists():
            return []
        
        images = []
        for file_path in project_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() == '.jpg':
                match = re.match(r'^(\d+)\.jpg$', file_path.name)
                if match:
                    images.append({
                        'filename': file_path.name,
                        'url': f'/api/projects/{project_name}/images/{file_path.name}'
                    })
        
        # Sort by number
        images.sort(key=lambda x: int(x['filename'].split('.')[0]))
        return images
    
    def delete_image(self, project_name: str, filename: str) -> bool:
        """Delete an image from a project."""
        if not re.match(r'^\d+\.jpg$', filename):
            return False
        
        project_path = self.get_project_path(project_name)
        file_path = project_path / filename
        
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
            return True
        return False
    
    def get_image_path(self, project_name: str, filename: str) -> Optional[Path]:
        """Get the path to an image file."""
        if not re.match(r'^\d+\.jpg$', filename):
            return None
        
        project_path = self.get_project_path(project_name)
        file_path = project_path / filename
        
        if file_path.exists() and file_path.is_file():
            return file_path
        return None
    
    def read_readme(self, project_name: str) -> str:
        """Read the README.md file for a project."""
        project_path = self.get_project_path(project_name)
        readme_path = project_path / "README.md"
        
        if readme_path.exists():
            return readme_path.read_text(encoding='utf-8')
        return ""
    
    def write_readme(self, project_name: str, content: str) -> None:
        """Write the README.md file for a project."""
        # Ensure project exists
        self.create_project(project_name)
        
        project_path = self.get_project_path(project_name)
        readme_path = project_path / "README.md"
        readme_path.write_text(content, encoding='utf-8')

storage = ProjectStorage()