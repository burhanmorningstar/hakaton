import psycopg2
from app.config import Config
from app.models.product import default_product

def get_db_connection():
    """Create a database connection to PostgreSQL"""
    conn = psycopg2.connect(
        host=Config.DB_HOST,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        port=Config.DB_PORT
    )
    conn.autocommit = True
    return conn

def init_db():
    """Initialize the database tables if they don't exist"""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Create table for the single product
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    error_rate FLOAT DEFAULT 0 NOT NULL,
                    production_count INTEGER DEFAULT 0 NOT NULL,
                    error_count INTEGER DEFAULT 0 NOT NULL
                )
            """)
            
            # Create table for image processing results
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS image_processing_results (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    defect_type VARCHAR(50),
                    confidence_score FLOAT,
                    location_x INTEGER,
                    location_y INTEGER,
                    width INTEGER,
                    height INTEGER
                )
            """)
            
            # Check if we need to create default product
            cursor.execute("SELECT COUNT(*) FROM product")
            count = cursor.fetchone()[0]
            if count == 0:
                # Insert default product
                cursor.execute(
                    "INSERT INTO product (name, error_rate, production_count, error_count) VALUES (%s, %s, %s, %s)",
                    (default_product["name"], default_product["error_rate"], 
                     default_product["production_count"], default_product["error_count"])
                )
                print("Default product created.")
        
        # Remove image_path column if it exists
        update_db_schema(conn)
        
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization error: {e}")

def update_db_schema(conn=None):
    """Update database schema to remove image_path column"""
    try:
        close_conn = False
        if conn is None:
            conn = get_db_connection()
            close_conn = True
            
        with conn.cursor() as cursor:
            # Check if image_path column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'image_processing_results' AND column_name = 'image_path'
            """)
            
            if cursor.fetchone():
                # Column exists, so drop it
                cursor.execute("ALTER TABLE image_processing_results DROP COLUMN IF EXISTS image_path")
                print("Removed image_path column from image_processing_results table")
            
            # Check if error_rate column allows NULL values
            cursor.execute("""
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'product' AND column_name = 'error_rate'
            """)
            
            nullable_result = cursor.fetchone()
            if nullable_result and nullable_result[0] == 'YES':
                # Make error_rate NOT NULL with default 0
                cursor.execute("""
                    UPDATE product SET error_rate = CASE
                                                        WHEN production_count > 0
                                                        THEN error_count * 100.0 / production_count
                                                        ELSE 0
                                                    END
                    WHERE error_rate IS NULL
                """)
                cursor.execute("ALTER TABLE product ALTER COLUMN error_rate SET NOT NULL")
                cursor.execute("ALTER TABLE product ALTER COLUMN error_rate SET DEFAULT 0")
                print("Modified error_rate column to NOT NULL with default 0")
        
        if close_conn:
            conn.close()
            
    except Exception as e:
        print(f"Error updating database schema: {e}")
        if close_conn and conn:
            conn.close() 