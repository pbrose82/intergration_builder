
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import logging
from logging.handlers import RotatingFileHandler
import os

db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    db.init_app(app)
    ma.init_app(app)
    configure_logging(app)

    from .routes import main_bp
    app.register_blueprint(main_bp)

    with app.app_context():
        db.create_all()

    return app

def configure_logging(app):
    if not os.path.exists('logs'):
        os.mkdir('logs')

    file_handler = RotatingFileHandler(
        'logs/integration_platform.log', 
        maxBytes=10240, 
        backupCount=10
    )

    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))

    file_handler.setLevel(app.config.get('LOG_LEVEL', 'INFO'))
    app.logger.addHandler(file_handler)
    app.logger.setLevel(app.config.get('LOG_LEVEL', 'INFO'))
    app.logger.info('Integration Platform startup')
