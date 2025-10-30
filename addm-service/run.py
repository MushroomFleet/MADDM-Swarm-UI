#!/usr/bin/env python3
"""
Runner script for ADDM service
Sets up Python path and imports main application
"""
import sys
import os
from pathlib import Path

# Add src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

# Now import and run the main application
from src.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Changed from 8000 to avoid conflicts
        reload=True if os.environ.get("ENVIRONMENT") == "development" else False
    )
