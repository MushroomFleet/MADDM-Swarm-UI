"""
ADDM FastAPI Service
Main application entry point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api.routes import router as decision_router
from core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.LOG_LEVEL == "info" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    logger.info("ADDM Service starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info("ADDM Service ready for requests")
    yield
    logger.info("ADDM Service shutting down...")


# Create FastAPI application
app = FastAPI(
    title="ADDM Loop Regulator Service",
    description="Agentic Drift-Diffusion Model for intelligent loop control",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(decision_router, prefix="/api/v1", tags=["decisions"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "addm-regulator",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ADDM Loop Regulator Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
