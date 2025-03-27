from app import db, ma
from datetime import datetime

class IntegrationConfig(db.Model):
    """
    Database model to store integration configurations
    """
    __tablename__ = 'integration_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(50), nullable=False)
    alchemy_config = db.Column(db.Text, nullable=False)
    platform_connection = db.Column(db.Text, nullable=False)
    field_mappings = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<IntegrationConfig {self.platform} - {self.id}>'

class IntegrationConfigSchema(ma.SQLAlchemyAutoSchema):
    """
    Marshmallow schema for serializing IntegrationConfig
    """
    class Meta:
        model = IntegrationConfig
        load_instance = True
        include_fk = True
