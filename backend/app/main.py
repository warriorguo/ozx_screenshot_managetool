from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any
from contextlib import asynccontextmanager
import uvicorn

from .config import CORS_ORIGINS, MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ensure_base_dir
from .storage import storage

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    ensure_base_dir()
    yield
    # Shutdown
    pass

app = FastAPI(title="Screenshot Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectCreate(BaseModel):
    name: str

class ProjectResponse(BaseModel):
    name: str
    created: bool

class ProjectDetail(BaseModel):
    name: str
    images: List[Dict[str, str]]
    readme: str

class ImageResponse(BaseModel):
    filename: str
    url: str

class ReadmeContent(BaseModel):
    content: str

class DeleteResponse(BaseModel):
    deleted: bool

@app.get("/api/projects")
async def list_projects():
    """List all projects."""
    projects = storage.list_projects()
    return {"projects": projects}

@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate):
    """Create or enter a project."""
    if not storage.validate_project_name(project.name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    created = storage.create_project(project.name)
    return ProjectResponse(name=project.name, created=created)

@app.get("/api/projects/{project_name}", response_model=ProjectDetail)
async def get_project_detail(project_name: str):
    """Get project details including images and README."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    project_path = storage.get_project_path(project_name)
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    images = storage.list_images(project_name)
    readme = storage.read_readme(project_name)
    
    return ProjectDetail(name=project_name, images=images, readme=readme)

@app.post("/api/projects/{project_name}/images", response_model=ImageResponse)
async def upload_image(project_name: str, file: UploadFile = File(...)):
    """Upload an image to a project."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Check file type
    if file.content_type and not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        filename = storage.save_image(project_name, content)
        url = f"/api/projects/{project_name}/images/{filename}"
        return ImageResponse(filename=filename, url=url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

@app.get("/api/projects/{project_name}/images/{filename}")
async def get_image(project_name: str, filename: str):
    """Get an image file."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    image_path = storage.get_image_path(project_name, filename)
    if not image_path:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image_path, media_type="image/jpeg")

@app.delete("/api/projects/{project_name}/images/{filename}", response_model=DeleteResponse)
async def delete_image(project_name: str, filename: str):
    """Delete an image from a project."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    deleted = storage.delete_image(project_name, filename)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return DeleteResponse(deleted=True)

@app.get("/api/projects/{project_name}/readme")
async def get_readme(project_name: str):
    """Get the README content for a project."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    project_path = storage.get_project_path(project_name)
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    content = storage.read_readme(project_name)
    return ReadmeContent(content=content)

@app.put("/api/projects/{project_name}/readme")
async def update_readme(project_name: str, readme: ReadmeContent):
    """Update the README content for a project."""
    if not storage.validate_project_name(project_name):
        raise HTTPException(status_code=400, detail="Invalid project name")
    
    try:
        storage.write_readme(project_name, readme.content)
        return ReadmeContent(content=readme.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save README: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)