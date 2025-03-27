from app import create_app, db
import os
import sys

# Create application instance
app = create_app()

@app.cli.command("create-db")
def create_db():
    """Create database tables"""
    try:
        db.create_all()
        print("Database tables created!")
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Ensure database exists
    try:
        with app.app_context():
            db.create_all()
    except Exception as e:
        print(f"Database initialization error: {e}")
        sys.exit(1)
    
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
