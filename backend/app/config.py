import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Database configuration
    SQLITE_DB_PATH = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'db.sqlite')
    
    # Flask configuration
    DEBUG = os.getenv("DEBUG", "True") == "True"
    HOST = os.getenv("HOST", "0.0.0.0")
    
    # Model configuration
    MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'best.pt'))
    DETECTION_THRESHOLD = float(os.getenv("DETECTION_THRESHOLD", "0.5")) 