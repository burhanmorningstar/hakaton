from flask import Blueprint, jsonify, request
from app.models.image_result import ImageResult
from app.models.product import Product
from app.config import Config
from ultralytics import YOLO
import cv2
import numpy as np
import os

image_bp = Blueprint('image_processing', __name__)

# Initialize YOLO model
model = YOLO(Config.MODEL_PATH)
threshold = Config.DETECTION_THRESHOLD

# Functions to get and set threshold
def get_threshold():
    """Get current threshold value"""
    global threshold
    return threshold

def set_threshold(value):
    """Set threshold value"""
    global threshold
    threshold = float(value)
    return threshold

@image_bp.route('/upload_from_unity', methods=['POST'])
def upload_image_from_unity():
    """Endpoint to receive and process images from Unity"""
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "No image part"}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        image_bytes = file.read()
        npimg = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({'error': 'Invalid image'}), 400

        model_results = model(frame)
        final_results = {}

        for box in model_results[0].boxes:
            cls_id = int(box.cls[0])
            class_name = model.model.names[cls_id]
            score = float(box.conf[0])

            # Calculate defect_percentage based on defect_type using switch-case logic
            defect_percentage = 0.0
            
            if class_name == "delikli":
                defect_percentage = 38
            elif class_name == "lekeli":
                defect_percentage = 13
            elif class_name == "eksen_kayik":
                defect_percentage = 56
            elif class_name == "ters_donmus":
                defect_percentage = 6
            elif class_name == "normal":
                defect_percentage = 0.0

            
            is_defected = defect_percentage > threshold
            
            # JSON response
            final_results = {
                "status": "success",
                "is_defected": is_defected,
                "defect_type": class_name,
                "defect_percentage": defect_percentage,
            }

            # Save to database
            data = {
                "is_defected": is_defected,
                "defect_type": class_name,
                "confidence_score": score
            }
            
            result_id = ImageResult.save_result(data)
            
            # Update production count
            Product.update_production_count()
            
            break  # Only save the first box

        return jsonify(final_results), 200
    
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

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

@image_bp.route('/update-threshold', methods=['POST'])
def update_threshold():
    """Update detection threshold"""
    global threshold
    
    try:
        data = request.get_json()
        
        if not data or 'threshold' not in data:
            return jsonify({'error': 'Missing "threshold" field in JSON'}), 400
            
        threshold_value = float(data['threshold'])
        
        # Store in settings table
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
        """, ('detection_threshold', str(threshold_value)))
        
        conn.commit()
        conn.close()
        
        # Update global variable
        threshold = threshold_value
        
        return jsonify({'message': 'Threshold updated', 'threshold': threshold}), 200
    except ValueError:
        return jsonify({"error": "Invalid threshold value"}), 400
    except Exception as e:
        print(f"Error updating threshold: {e}")
        return jsonify({"error": str(e)}), 500 