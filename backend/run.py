from app import create_app
from app.config import Config
from app.models.product import Product

app = create_app(Config)

if __name__ == '__main__':
    # Ensure error_rates are repaired on startup
    Product.repair_error_rates()
    app.run(debug=Config.DEBUG, host=Config.HOST) 