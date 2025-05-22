class ImageResult:
    @staticmethod
    def save_result(data):
        """Save image processing result to database"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Insert image processing result
            cursor.execute("""
                INSERT INTO image_processing_results
                (defect_type, confidence_score, location_x, location_y, width, height, is_defected)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('defect_type', ''),
                data.get('confidence_score', 0),
                data.get('location_x', 0),
                data.get('location_y', 0),
                data.get('width', 0),
                data.get('height', 0),
                data.get('is_defected', 0)
            ))
            
            result_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Update product error stats
            from app.models.product import Product
            Product.update_error_stats()
            
            return result_id
        except Exception as e:
            print(f"Error saving image result: {e}")
            return None
    
    @staticmethod
    def get_results(limit=None):
        """Get image processing results from database"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            if limit:
                cursor.execute("""
                    SELECT id, timestamp, defect_type, confidence_score, 
                    location_x, location_y, width, height, is_defected
                    FROM image_processing_results
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (limit,))
            else:
                cursor.execute("""
                    SELECT id, timestamp, defect_type, confidence_score, 
                    location_x, location_y, width, height, is_defected
                    FROM image_processing_results
                    ORDER BY timestamp DESC
                """)
                
            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row[0],
                    "timestamp": row[1],
                    "defect_type": row[2],
                    "confidence_score": row[3],
                    "location_x": row[4],
                    "location_y": row[5],
                    "width": row[6],
                    "height": row[7],
                    "is_defected": bool(row[8])
                })
            
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting image results: {e}")
            return []
            
    @staticmethod
    def clear_results():
        """Clear all image processing results"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM image_processing_results")
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error clearing image results: {e}")
            return False 