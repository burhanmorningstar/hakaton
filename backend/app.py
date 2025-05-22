from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import os
from flask_sqlalchemy import SQLAlchemy
import datetime
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
# Veritabanı yolunu ayarla
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'db.sqlite')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# SQLAlchemy başlat
db = SQLAlchemy(app)

class DetectionResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    is_defected = db.Column(db.Boolean, nullable=False)
    defect_type = db.Column(db.String(100), nullable=False)
    defect_percentage = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now)

class Setting(db.Model):
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(200), nullable=False)


model = YOLO('best.pt')
DEFAULT_THRESHOLD = 0.5

# Create all tables
with app.app_context():
    db.create_all()
    # Set default threshold if not exists
    threshold_setting = Setting.query.filter_by(key='detection_threshold').first()
    if not threshold_setting:
        threshold_setting = Setting(key='detection_threshold', value=str(DEFAULT_THRESHOLD))
        db.session.add(threshold_setting)
        db.session.commit()
        
    # Add some mock product data for testing
    try:
        # Check if product table exists and is empty
        cursor = db.session.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product'")
        if cursor.first():
            cursor = db.session.execute("SELECT COUNT(*) FROM product")
            if cursor.scalar() == 0:
                # Create products table if not exists
                db.session.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    error_rate REAL DEFAULT 0.0,
                    production_count INTEGER DEFAULT 0,
                    error_count INTEGER DEFAULT 0
                )
                """)
                
                # Insert mock products
                mock_products = [
                    {"name": "Ürün A", "error_rate": 0.5, "production_count": 1000, "error_count": 5},
                    {"name": "Ürün B", "error_rate": 1.2, "production_count": 2500, "error_count": 30},
                    {"name": "Ürün C", "error_rate": 2.7, "production_count": 1800, "error_count": 49},
                    {"name": "Ürün D", "error_rate": 0.2, "production_count": 500, "error_count": 1},
                    {"name": "Ürün E", "error_rate": 3.5, "production_count": 3000, "error_count": 105},
                    {"name": "Ürün F", "error_rate": 1.8, "production_count": 1200, "error_count": 22},
                ]
                
                for product in mock_products:
                    db.session.execute("""
                    INSERT INTO product (name, error_rate, production_count, error_count)
                    VALUES (:name, :error_rate, :production_count, :error_count)
                    """, product)
                    
                db.session.commit()
                print("Mock product data created.")
    except Exception as e:
        print(f"Error creating mock product data: {e}")


def get_threshold():
    """Get current threshold value from database"""
    threshold_setting = Setting.query.filter_by(key='detection_threshold').first()
    if threshold_setting:
        return float(threshold_setting.value)
    return DEFAULT_THRESHOLD


def set_threshold(value):
    """Set threshold value in database"""
    threshold_setting = Setting.query.filter_by(key='detection_threshold').first()
    if threshold_setting:
        threshold_setting.value = str(value)
    else:
        threshold_setting = Setting(key='detection_threshold', value=str(value))
        db.session.add(threshold_setting)
    db.session.commit()
    return value


def update_production_stats(is_defected):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Get current values
    cursor.execute("SELECT production_count, error_count FROM product LIMIT 1")
    row = cursor.fetchone()
    if row:
        production_count = row[0] + 1
        error_count = row[1] + (1 if is_defected else 0)
        error_rate = (error_count * 100.0) / production_count if production_count > 0 else 0.0
        cursor.execute("""
            UPDATE product
            SET production_count = ?, error_count = ?, error_rate = ?
        """, (production_count, error_count, error_rate))
        conn.commit()
    conn.close()


@app.route('/upload_from_unity', methods=['POST'])
def upload_image():
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

    # Get threshold from database
    threshold = get_threshold()
    
    model_results = model(frame)
    final_results = {}

    for box in model_results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = model.model.names[cls_id]
        score = float(box.conf[0])
        is_defected = score > threshold

        # JSON cevabı
        final_results = {
            "status": "success",
            "is_defected": is_defected,
            "defect_type": class_name,
            "defect_percentage": score,
        }

        # Veritabanına kaydet
        detection = DetectionResult(
            is_defected=is_defected,
            defect_type=class_name,
            defect_percentage=score
        )
        db.session.add(detection)
        db.session.commit()

        # Üretim ve hata istatistiğini güncelle
        update_production_stats(is_defected)

        break  # Sadece ilk kutuyu kaydet

    return jsonify(final_results), 200


@app.route('/update_threshold', methods=['POST'])
def update_threshold():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'JSON body missing'}), 400

    if 'threshold' not in data:
        return jsonify({'error': 'Missing "threshold" field in JSON'}), 400

    threshold_value = float(data['threshold'])
    set_threshold(threshold_value)

    return jsonify({'message': 'Threshold received', 'threshold': threshold_value}), 200


@app.route('/api/threshold', methods=['GET', 'POST'])
def api_threshold():
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'threshold' not in data:
                return jsonify({"error": "Missing threshold value"}), 400
                
            threshold = float(data['threshold'])
            if threshold < 0 or threshold > 100:
                return jsonify({"error": "Threshold must be between 0 and 100"}), 400
                
            # Store threshold in database
            set_threshold(threshold / 100.0)  # Convert percentage to decimal
            
            return jsonify({"message": "Threshold updated", "threshold": threshold}), 200
        except ValueError:
            return jsonify({"error": "Invalid threshold value"}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # GET request - return current threshold
        try:
            threshold = get_threshold() * 100.0  # Convert decimal to percentage
            return jsonify({"threshold": threshold})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route('/api/image-results', methods=['GET'])
def get_image_results():
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # Query the most recent detection results
        results = DetectionResult.query.order_by(DetectionResult.id.desc()).limit(limit).all()
        
        # Format results for JSON response
        formatted_results = []
        for result in results:
            formatted_results.append({
                "defect_type": result.defect_type,
                "confidence_score": result.defect_percentage,
                "is_defected": result.is_defected,
                "timestamp": result.timestamp.isoformat() if result.timestamp else None
            })
        
        return jsonify(formatted_results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


import sqlite3

default_product = {
    "production_count": 0,
    "error_count": 0,
    "error_rate": 0.0,
}

def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row  # Dict benzeri erişim
    return conn

class Statistics:
    @staticmethod
    def get_statistics():
        """Get statistics from the database (with timestamp support)"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Toplam üretim
            cursor.execute("SELECT COUNT(*) FROM detection_result")
            production_count = cursor.fetchone()[0]

            # Hatalı kayıt sayısı
            cursor.execute("SELECT COUNT(*) FROM detection_result WHERE is_defected=1")
            error_count = cursor.fetchone()[0]

            # Hata oranı - make sure it's a percentage (multiply by 100)
            error_rate = ((error_count * 100.0) / production_count) if production_count else 0.0

            # Defect type dağılımı
            cursor.execute("""
                SELECT defect_type, COUNT(*) as defect_count
                FROM detection_result
                GROUP BY defect_type
                ORDER BY defect_count DESC
            """)
            defect_types = {row[0]: row[1] for row in cursor.fetchall()}

            # Saatlik trend (son 24 saat, saat bazında)
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                    COUNT(*) 
                FROM detection_result
                GROUP BY hour
                ORDER BY hour DESC
                LIMIT 24
            """)
            hourly_trend = {row[0]: row[1] for row in cursor.fetchall()}

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
            return {
                "production_count": default_product["production_count"],
                "error_count": default_product["error_count"],
                "error_rate": default_product["error_rate"],
                "defect_types": {},
                "hourly_trend": {}
            }


@app.route('/api/products/by-threshold', methods=['GET'])
def get_products_by_threshold():
    try:
        # Hatasız ürünler: error_count == 0 ve production_count > 0
        error_free_query = db.session.execute(
            "SELECT id, name, error_rate, production_count, error_count FROM product WHERE error_count = 0 AND production_count > 0"
        ).fetchall()
        # Hatalı ürünler: error_count > 0 ve production_count > 0
        faulty_query = db.session.execute(
            "SELECT id, name, error_rate, production_count, error_count FROM product WHERE error_count > 0 AND production_count > 0"
        ).fetchall()

        def row_to_dict(row):
            production_count = row[3]
            error_count = row[4]
            error_rate = (error_count * 100.0) / production_count if production_count > 0 else 0.0
            return {
                "id": row[0],
                "name": row[1],
                "error_rate": error_rate,
                "production_count": production_count,
                "error_count": error_count
            }

        error_free = [row_to_dict(row) for row in error_free_query]
        faulty = [row_to_dict(row) for row in faulty_query]

        return jsonify({
            "error_free": error_free,
            "faulty": faulty,
            "message": None if error_free else "Hatasız ürün bulunmamaktadır"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/product', methods=['GET'])
def get_product():
    """Get product information"""
    try:
        # Query the first product from the database
        result = db.session.execute("SELECT id, name, error_rate, production_count, error_count FROM product LIMIT 1")
        row = result.fetchone()
        
        if row:
            # Calculate the error rate as a percentage
            production_count = row[3]
            error_count = row[4]
            
            if production_count > 0:
                error_rate = (error_count * 100.0) / production_count
            else:
                error_rate = 0.0
                
            product = {
                "id": row[0],
                "name": row[1],
                "error_rate": error_rate,  # Use calculated value
                "production_count": production_count,
                "error_count": error_count
            }
        else:
            # Default product if none found
            product = {
                "name": "Üretim Hattı",
                "error_rate": 0.0,
                "production_count": 0,
                "error_count": 0
            }
        
        return jsonify(product)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
