import sqlite3
import os
from app.config import Config
from app.models.product import default_product

def get_db_connection():
    """Create a database connection to SQLite"""
    db_path = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Dict-like access
    return conn

def init_db():
    """Initialize the database tables if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create table for the single product
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                error_rate REAL DEFAULT 0 NOT NULL,
                production_count INTEGER DEFAULT 0 NOT NULL,
                error_count INTEGER DEFAULT 0 NOT NULL
            )
        """)
        
        # Create table for image processing results
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS image_processing_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                defect_type TEXT,
                confidence_score REAL,
                location_x INTEGER,
                location_y INTEGER,
                width INTEGER,
                height INTEGER,
                is_defected BOOLEAN DEFAULT 0
            )
        """)
        
        # Create settings table for app configuration
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        
        # Initialize default settings if not exist
        cursor.execute("SELECT COUNT(*) FROM settings WHERE key = 'detection_threshold'")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)",
                          ('detection_threshold', str(Config.DETECTION_THRESHOLD)))
        
        # Check if we need to create default product
        cursor.execute("SELECT COUNT(*) FROM product")
        count = cursor.fetchone()[0]
        if count == 0:
            # Insert default product
            cursor.execute(
                "INSERT INTO product (name, error_rate, production_count, error_count) VALUES (?, ?, ?, ?)",
                (default_product["name"], default_product["error_rate"], 
                 default_product["production_count"], default_product["error_count"])
            )
            print("Default product created.")
        
        conn.commit()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization error: {e}")

def update_db_schema(conn=None):
    """Update database schema if needed"""
    try:
        close_conn = False
        if conn is None:
            conn = get_db_connection()
            close_conn = True
            
        cursor = conn.cursor()
        
        # Check if is_defected column exists in image_processing_results
        cursor.execute("PRAGMA table_info(image_processing_results)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'is_defected' not in columns:
            cursor.execute("ALTER TABLE image_processing_results ADD COLUMN is_defected BOOLEAN DEFAULT 0")
            print("Added is_defected column to image_processing_results table")
        
        conn.commit()
        
        if close_conn:
            conn.close()
            
    except Exception as e:
        print(f"Error updating database schema: {e}")
        if close_conn and conn:
            conn.close() 