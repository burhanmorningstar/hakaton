from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app)
    
    # Initialize database
    from app.db.database import init_db
    init_db()
    
    # Register blueprints
    from app.routes.products import product_bp
    from app.routes.statistics import stats_bp
    from app.routes.image_processing import image_bp
    
    app.register_blueprint(product_bp, url_prefix='/api')
    app.register_blueprint(stats_bp, url_prefix='/api')
    app.register_blueprint(image_bp, url_prefix='/api')
    
    @app.route('/test', methods=['GET'])
    def test():
        from flask import jsonify
        return jsonify({'message': 'API is working!', 'status': 'success'})
    
    return app 