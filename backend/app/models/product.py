# Mock database of products with error rates
mock_products = [
    {"id": 1, "name": "Ürün A", "error_rate": 0.5, "production_count": 1000, "error_count": 5},
    {"id": 2, "name": "Ürün B", "error_rate": 1.2, "production_count": 2500, "error_count": 30},
    {"id": 3, "name": "Ürün C", "error_rate": 2.7, "production_count": 1800, "error_count": 49},
    {"id": 4, "name": "Ürün D", "error_rate": 0.2, "production_count": 500, "error_count": 0},
    {"id": 5, "name": "Ürün E", "error_rate": 3.5, "production_count": 3000, "error_count": 105},
    {"id": 6, "name": "Ürün F", "error_rate": 1.8, "production_count": 1200, "error_count": 22},
    {"id": 7, "name": "Ürün G", "error_rate": 4.2, "production_count": 950, "error_count": 40},
    {"id": 8, "name": "Ürün H", "error_rate": 0.8, "production_count": 1600, "error_count": 13},
]

# Default product data
default_product = {
    "name": "Üretim Hattı", 
    "error_rate": 0.0, 
    "production_count": 0, 
    "error_count": 0
}

class Product:
    @staticmethod
    def calculate_error_rate(error_count, production_count):
        """Calculate error rate as a percentage"""
        if production_count is None or production_count <= 0:
            return 0.0
        if error_count is None:
            error_count = 0
        return (error_count * 100.0) / production_count
    
    @staticmethod
    def get_all():
        """Get all products from database"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM products")
                products = []
                for row in cursor.fetchall():
                    product = {
                        "id": row[0],
                        "name": row[1],
                        "production_count": row[3],
                        "error_count": row[4]
                    }
                    # Calculate error_rate if it's None/NULL
                    if row[2] is None:
                        product["error_rate"] = Product.calculate_error_rate(row[4], row[3])
                    else:
                        product["error_rate"] = row[2]
                    products.append(product)
                
                conn.close()
                return products
        except Exception as e:
            print(f"Error getting products: {e}")
            # Fall back to mock data if DB fails
            return mock_products
    
    @staticmethod
    def get_by_threshold(threshold):
        """Get products filtered by error rate threshold"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM products WHERE error_rate < %s OR (error_rate IS NULL AND error_count * 100.0 / NULLIF(production_count, 0) < %s)", (threshold, threshold))
                error_free = []
                for row in cursor.fetchall():
                    product = {
                        "id": row[0],
                        "name": row[1],
                        "production_count": row[3],
                        "error_count": row[4]
                    }
                    # Calculate error_rate if it's None/NULL
                    if row[2] is None:
                        product["error_rate"] = Product.calculate_error_rate(row[4], row[3])
                    else:
                        product["error_rate"] = row[2]
                    error_free.append(product)
                
                cursor.execute("SELECT * FROM products WHERE error_rate >= %s OR (error_rate IS NULL AND error_count * 100.0 / NULLIF(production_count, 0) >= %s)", (threshold, threshold))
                faulty = []
                for row in cursor.fetchall():
                    product = {
                        "id": row[0],
                        "name": row[1],
                        "production_count": row[3],
                        "error_count": row[4]
                    }
                    # Calculate error_rate if it's None/NULL
                    if row[2] is None:
                        product["error_rate"] = Product.calculate_error_rate(row[4], row[3])
                    else:
                        product["error_rate"] = row[2]
                    faulty.append(product)
                
                conn.close()
                return error_free, faulty
        except Exception as e:
            print(f"Error getting products by threshold: {e}")
            # Fall back to mock data if DB fails
            error_free = [p for p in mock_products if p["error_rate"] < threshold]
            faulty = [p for p in mock_products if p["error_rate"] >= threshold]
            return error_free, faulty

    @staticmethod
    def get_product():
        """Get the single product from database"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM product LIMIT 1")
                row = cursor.fetchone()
                
                if row:
                    product = {
                        "id": row[0],
                        "name": row[1],
                        "production_count": row[3],
                        "error_count": row[4]
                    }
                    
                    # Calculate error_rate if it's None/NULL
                    if row[2] is None:
                        product["error_rate"] = Product.calculate_error_rate(row[4], row[3])
                    else:
                        product["error_rate"] = row[2]
                else:
                    product = default_product
                
                conn.close()
                return product
        except Exception as e:
            print(f"Error getting product: {e}")
            # Fall back to default data if DB fails
            return default_product
    
    @staticmethod
    def update_production_count(count=1):
        """Increment production count"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE product 
                    SET production_count = production_count + %s,
                        error_rate = CASE 
                                        WHEN (production_count + %s) > 0 
                                        THEN (error_count * 100.0 / (production_count + %s))
                                        ELSE 0
                                    END
                """, (count, count, count))
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating production count: {e}")
            return False

    @staticmethod
    def update_error_stats():
        """Update product error count and recalculate error rate"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE product 
                    SET error_count = error_count + 1,
                        error_rate = CASE 
                                        WHEN production_count > 0 
                                        THEN (error_count + 1) * 100.0 / production_count
                                        ELSE 0
                                    END
                """)
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating product error stats: {e}")
            return False

    @staticmethod
    def repair_error_rates():
        """Fix any NULL error_rate values in the database by calculating them from production_count and error_count"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                # Update the product table where error_rate is NULL
                cursor.execute("""
                    UPDATE product 
                    SET error_rate = CASE 
                                        WHEN production_count > 0 
                                        THEN error_count * 100.0 / production_count
                                        ELSE 0
                                    END
                    WHERE error_rate IS NULL
                """)
                
                # Update products table if it exists (for multi-product setup)
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'products'
                    )
                """)
                
                if cursor.fetchone()[0]:  # If products table exists
                    cursor.execute("""
                        UPDATE products 
                        SET error_rate = CASE 
                                            WHEN production_count > 0 
                                            THEN error_count * 100.0 / production_count
                                            ELSE 0
                                        END
                        WHERE error_rate IS NULL
                    """)
                    
            conn.close()
            return True
        except Exception as e:
            print(f"Error repairing error rates: {e}")
            return False

    @staticmethod
    def reset_stats():
        """Reset product statistics"""
        from app.db.database import get_db_connection
        
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE product 
                    SET error_count = 0,
                        production_count = 0,
                        error_rate = 0
                """)
            conn.close()
            return True
        except Exception as e:
            print(f"Error resetting product stats: {e}")
            return False 