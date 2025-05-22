import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Database configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "hakaton")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    DB_PORT = os.getenv("DB_PORT", "5432")
    
    # Flask configuration
    DEBUG = os.getenv("DEBUG", "True") == "True"
    HOST = os.getenv("HOST", "0.0.0.0") 