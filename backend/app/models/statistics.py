from app.db.database import get_db_connection
from app.models.product import default_product

class Statistics:
    @staticmethod
    def get_statistics():
        """Get statistics from the database"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get product stats
            cursor.execute("SELECT * FROM product LIMIT 1")
            row = cursor.fetchone()
            
            if row:
                production_count = row[3] or 0
                error_count = row[4] or 0
                error_rate = row[2] or 0
            else:
                production_count = default_product["production_count"]
                error_count = default_product["error_count"]
                error_rate = default_product["error_rate"]
            
            # Get defect type distribution
            cursor.execute("""
                SELECT defect_type, COUNT(*) 
                FROM image_processing_results 
                GROUP BY defect_type 
                ORDER BY COUNT(*) DESC
            """)
            
            defect_types = {}
            for row in cursor.fetchall():
                defect_types[row[0]] = row[1]
            
            # Get hourly trend - SQLite version
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m-%dT%H:00:00', timestamp) as hour, 
                    COUNT(*) 
                FROM image_processing_results 
                GROUP BY hour 
                ORDER BY hour DESC 
                LIMIT 24
            """)
            
            hourly_trend = {}
            for row in cursor.fetchall():
                hourly_trend[row[0]] = row[1]
            
            conn.close()
            
            return {
                "production_count": production_count,
                "error_count": error_count,
                "error_rate": error_rate,
                "defect_types": defect_types,
                "hourly_trend": hourly_trend
            }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            # Fall back to default data if DB fails
            return {
                "production_count": default_product["production_count"],
                "error_count": default_product["error_count"],
                "error_rate": default_product["error_rate"],
                "defect_types": {},
                "hourly_trend": {}
            } 