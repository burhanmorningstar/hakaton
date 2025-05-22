class ImageResult:
    @staticmethod
    def save_result(data):
        """Save image processing result to database"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                # Insert image processing result
                cursor.execute("""
                    INSERT INTO image_processing_results
                    (defect_type, confidence_score, location_x, location_y, width, height)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    data['defect_type'],
                    data['confidence_score'],
                    data['location_x'],
                    data['location_y'],
                    data['width'],
                    data['height']
                ))
                
                result_id = cursor.fetchone()[0]
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
            with conn.cursor() as cursor:
                if limit:
                    cursor.execute("""
                        SELECT id, timestamp, defect_type, confidence_score, 
                        location_x, location_y, width, height
                        FROM image_processing_results
                        ORDER BY timestamp DESC
                        LIMIT %s
                    """, (limit,))
                else:
                    cursor.execute("""
                        SELECT id, timestamp, defect_type, confidence_score, 
                        location_x, location_y, width, height
                        FROM image_processing_results
                        ORDER BY timestamp DESC
                    """)
                    
                results = []
                for row in cursor.fetchall():
                    results.append({
                        "id": row[0],
                        "timestamp": row[1].isoformat(),
                        "defect_type": row[2],
                        "confidence_score": row[3],
                        "location_x": row[4],
                        "location_y": row[5],
                        "width": row[6],
                        "height": row[7]
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
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM image_processing_results")
            conn.close()
            return True
        except Exception as e:
            print(f"Error clearing image results: {e}")
            return False 