from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

# Summary statistics
def get_statistics():
    total_products = len(mock_products)
    total_production = sum(p["production_count"] for p in mock_products)
    total_errors = sum(p["error_count"] for p in mock_products)
    avg_error_rate = sum(p["error_rate"] for p in mock_products) / total_products
    
    # Count products by error range
    error_ranges = {
        "0": len([p for p in mock_products if p["error_rate"] == 0]),
        "0-1": len([p for p in mock_products if 0 < p["error_rate"] <= 1]),
        "1-2": len([p for p in mock_products if 1 < p["error_rate"] <= 2]),
        "2-3": len([p for p in mock_products if 2 < p["error_rate"] <= 3]),
        "3+": len([p for p in mock_products if p["error_rate"] > 3])
    }
    
    return {
        "total_products": total_products,
        "total_production": total_production,
        "total_errors": total_errors,
        "avg_error_rate": avg_error_rate,
        "error_ranges": error_ranges
    }

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!', 'status': 'success'})

@app.route('/api/products', methods=['GET'])
def get_products():
    threshold = request.args.get('threshold', type=float)
    
    if threshold is not None:
        error_free = [p for p in mock_products if p["error_rate"] < threshold]
        faulty = [p for p in mock_products if p["error_rate"] >= threshold]
        
        # Check if looking for 0% error and none exist
        if threshold == 0 and not error_free:
            return jsonify({
                "message": "Yüzde 0 hatalı ürün bulunmamaktadır",
                "error_free": [],
                "faulty": mock_products
            })
        
        return jsonify({
            "error_free": error_free,
            "faulty": faulty
        })
    
    return jsonify(mock_products)

@app.route('/api/statistics', methods=['GET'])
def statistics():
    return jsonify(get_statistics())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Listen on all network interfaces
