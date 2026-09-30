import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "STRELA — H2S Exposure Advisory Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # LLM Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    FALLBACK_MODEL: str = "groq/compound"
    VLLM_ENDPOINT_URL: str = ""
    
    # Weather API Settings (Open-Meteo is free & keyless by default; OpenWeatherMap is optional)
    OPENWEATHER_API_KEY: str = ""
    WEATHERAPI_KEY: str = ""
    DCS_TELEMETRY_ENDPOINT: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./rakshak.db"
    
    # Weather / Telemetry (Default MRPL Mangalore Lat/Lon)
    DEFAULT_LAT: float = 12.9904
    DEFAULT_LON: float = 74.8219
    
    # Statutory Thresholds (PPM & PPM·hr)
    TIER1_TWA_MAX: float = 1.0     # ppm
    TIER1_7DAY_MAX: float = 15.0   # ppm·hr
    TIER2_TWA_MAX: float = 5.0     # ppm
    TIER2_7DAY_MAX: float = 35.0   # ppm·hr
    SINGLE_SHIFT_CRITICAL_DOSE: float = 20.0 # ppm·hr
    
    # RAG CRAG Threshold
    RAG_CONFIDENCE_THRESHOLD: float = 0.85

    # Load from .env automatically
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
