"""
Configuration management for ADDM service
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal


class Settings(BaseSettings):
    """Application settings"""

    # API Keys
    OPENROUTER_API_KEY: str = Field(..., description="OpenRouter API key")

    # Environment
    ENVIRONMENT: Literal["development", "production"] = Field(
        default="development",
        description="Application environment"
    )

    # Logging
    LOG_LEVEL: Literal["info", "warning", "error"] = Field(
        default="info",
        description="Logging level"
    )

    # ADDM Parameters
    MAX_ITERATIONS: int = Field(default=20, description="Maximum loop iterations")
    DEFAULT_CONFIDENCE_THRESHOLD: float = Field(
        default=0.85,
        description="Default confidence threshold for completion"
    )
    CONTEXT_SUMMARIZATION_THRESHOLD: int = Field(
        default=32000,
        description="Character count for automatic context summarization"
    )

    # OpenRouter Configuration
    OPENROUTER_MODEL: str = Field(
        default="anthropic/claude-sonnet-4-20250514",
        description="Model to use for ADDM decisions"
    )
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1",
        description="OpenRouter API base URL"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
