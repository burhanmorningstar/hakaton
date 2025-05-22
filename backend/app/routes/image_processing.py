from flask import Blueprint, jsonify, request
from app.models.image_result import ImageResult

image_bp = Blueprint('image_processing', __name__)

@image_bp.route('/image-processing', methods=['POST'])
def process_image():
    """Endpoint to receive image processing results"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['defect_type', 'confidence_score', 'location_x', 
                          'location_y', 'width', 'height']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        result_id = ImageResult.save_result(data)
        
        if result_id:
            return jsonify({
                "message": "Image processing result recorded successfully",
                "result_id": result_id
            }), 201
        else:
            return jsonify({"error": "Failed to save image processing result"}), 500
        
    except Exception as e:
        print(f"Error processing image data: {e}")
        return jsonify({"error": str(e)}), 500

@image_bp.route('/image-results', methods=['GET'])
def get_image_results():
    """Get image processing results, optionally limited"""
    try:
        limit = request.args.get('limit', type=int)
        results = ImageResult.get_results(limit)
        return jsonify(results)
    except Exception as e:
        print(f"Error getting image results: {e}")
        return jsonify({"error": str(e)}), 500

@image_bp.route('/clear-results', methods=['POST'])
def clear_results():
    """Clear all image processing results"""
    try:
        success = ImageResult.clear_results()
        if success:
            return jsonify({"message": "Image processing results cleared successfully"}), 200
        else:
            return jsonify({"error": "Failed to clear image processing results"}), 500
    except Exception as e:
        print(f"Error clearing image results: {e}")
        return jsonify({"error": str(e)}), 500 