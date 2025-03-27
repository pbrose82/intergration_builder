from app import db, ma
from datetime import datetime
import json

class SalesforceIntegration(db.Model):
    """
    Model to store Salesforce integration configurations
    """
    __tablename__ = 'salesforce_integrations'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Alchemy LIMS Configuration
    alchemy_base_url = db.Column(db.String(255), nullable=False)
    alchemy_api_key = db.Column(db.String(255), nullable=False)
    
    # Salesforce Connection Details
    salesforce_username = db.Column(db.String(255), nullable=False)
    
    # Field Mapping Configuration
    field_mappings = db.Column(db.JSON, nullable=True)
    
    # Synchronization Settings
    sync_frequency = db.Column(db.String(50), default='daily')
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_field_mappings(self, mappings):
        """
        Set field mappings as a JSON string
        
        Args:
            mappings (dict): Dictionary of field mappings
        """
        self.field_mappings = json.dumps(mappings)
    
    def get_field_mappings(self):
        """
        Retrieve field mappings
        
        Returns:
            dict: Field mappings
        """
        return json.loads(self.field_mappings) if self.field_mappings else {}
    
    def __repr__(self):
        return f'<SalesforceIntegration {self.id}>'

class SalesforceIntegrationSchema(ma.SQLAlchemyAutoSchema):
    """
    Marshmallow schema for serializing SalesforceIntegration
    """
    class Meta:
        model = SalesforceIntegration
        load_instance = True
        include_fk = True
