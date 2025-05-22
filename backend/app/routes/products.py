from flask import Blueprint, jsonify, request
from app.models.product import Product

product_bp = Blueprint('products', __name__)

@product_bp.route('/product', methods=['GET'])
def get_product():
    """Get the product data"""
    product = Product.get_product()
    return jsonify(product)

@product_bp.route('/products', methods=['GET'])
def get_products():
    """Get all products"""
    products = Product.get_all()
    return jsonify(products)

@product_bp.route('/products/by-threshold', methods=['GET'])
def get_products_by_threshold():
    """Get products filtered by threshold"""
    try:
        # Get threshold from query params, default to 2.0
        threshold = float(request.args.get('threshold', 2.0))
        
        # Get products filtered by threshold
        error_free, faulty = Product.get_by_threshold(threshold)
        
        # Check if no products with zero error rate
        zero_error_message = None
        if threshold == 0 and len(error_free) == 0:
            zero_error_message = "Yüzde 0 hatalı ürün bulunmamaktadır"
        
        return jsonify({
            "error_free": error_free,
            "faulty": faulty,
            "message": zero_error_message
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@product_bp.route('/product/update-production', methods=['POST'])
def update_production():
    """Update production count"""
    data = request.get_json()
    count = data.get('count', 1) if data else 1
    
    success = Product.update_production_count(count)
    if success:
        return jsonify({"message": "Production count updated successfully"}), 200
    else:
        return jsonify({"error": "Failed to update production count"}), 500

@product_bp.route('/threshold', methods=['GET', 'POST'])
def manage_threshold():
    """Get or update detection threshold"""
    from app.config import Config
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'threshold' not in data:
                return jsonify({"error": "Missing threshold value"}), 400
                
            threshold = float(data['threshold'])
            if threshold < 0 or threshold > 100:
                return jsonify({"error": "Threshold must be between 0 and 100"}), 400
                
            # Store threshold in database or config
            from app.db.database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if settings table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
            
            # Insert or update threshold
            cursor.execute("""
                INSERT OR REPLACE INTO settings (key, value) 
                VALUES (?, ?)
            """, ('detection_threshold', str(threshold)))
            
            conn.commit()
            conn.close()
            
            # Update global variable in image_processing route
            from app.routes.image_processing import set_threshold
            set_threshold(threshold / 100.0)  # Convert percentage to decimal
            
            return jsonify({"message": "Threshold updated", "threshold": threshold}), 200
        except ValueError:
            return jsonify({"error": "Invalid threshold value"}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # GET request - return current threshold
        try:
            # Get from database if available
            from app.db.database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT value FROM settings WHERE key = 'detection_threshold'
            """)
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                threshold = float(row[0])
            else:
                # Fall back to config value
                from app.routes.image_processing import get_threshold
                threshold = get_threshold() * 100.0  # Convert decimal to percentage
                
            return jsonify({"threshold": threshold})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@product_bp.route('/product/repair-error-rates', methods=['POST'])
def repair_error_rates():
    """Repair any NULL error_rate values in the database"""
    success = Product.repair_error_rates()
    if success:
        return jsonify({"message": "Error rates repaired successfully"}), 200
    else:
        return jsonify({"error": "Failed to repair error rates"}), 500

@product_bp.route('/product/reset', methods=['POST'])
def reset_product():
    """Reset product statistics"""
    # Also clear image processing results
    from app.models.image_result import ImageResult
    ImageResult.clear_results()
    
    success = Product.reset_stats()
    if success:
        return jsonify({"message": "Product statistics reset successfully"}), 200
    else:
        return jsonify({"error": "Failed to reset product statistics"}), 500 