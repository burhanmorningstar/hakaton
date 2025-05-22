from flask import Blueprint, jsonify, request
from app.models.product import Product

product_bp = Blueprint('products', __name__)

@product_bp.route('/product', methods=['GET'])
def get_product():
    """Get the product data"""
    product = Product.get_product()
    return jsonify(product)

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