from app import create_app, db
import os

# Create application instance
app = create_app()

@app.cli.command("create-db")
def create_db():
    """Create database tables"""
    db.create_all()
    print("Database tables created!")

if __name__ == '__main__':
    # Ensure database exists
    with app.app_context():
        db.create_all()
    
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
