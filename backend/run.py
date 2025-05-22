from app import create_app
from app.config import Config
from app.db.database import update_db_schema

app = create_app(Config)

if __name__ == '__main__':
    # Ensure database schema is up-to-date
    update_db_schema()
    app.run(debug=Config.DEBUG, host=Config.HOST) 