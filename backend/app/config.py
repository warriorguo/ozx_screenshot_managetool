import os
from pathlib import Path

BASE_DIR = Path(os.environ.get("STORAGE_DIR", "data")).resolve()
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

def ensure_base_dir():
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    if not os.access(BASE_DIR, os.W_OK):
        raise PermissionError(f"Cannot write to storage directory: {BASE_DIR}")