import sys
import os
sys.path.append(os.getcwd())
try:
    from database import engine
    import models
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
except Exception as e:
    print(f"Error: {e}")
