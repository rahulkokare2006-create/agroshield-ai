"""
AGROSHIELD AI - Local Backend Runner
====================================
Runs the FastAPI production backend on port 8000.
"""

import uvicorn
import os
import sys

# Ensure AGROSHIELD-AI root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    print("==================================================")
    print("  AGROSHIELD AI - Backend Server Starting...")
    print("  API URL: http://localhost:8000")
    print("  Interactive Docs (Swagger): http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
