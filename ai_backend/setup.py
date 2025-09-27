#!/usr/bin/env python3
"""
Setup script for the AI Backend
This script will install dependencies and download required models
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}:")
        print(f"   Command: {command}")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_requirements():
    """Install Python requirements"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    command = f"{sys.executable} -m pip install -r {requirements_file}"
    return run_command(command, "Installing Python requirements")

def download_yolo_model():
    """Download YOLO model"""
    print("🤖 Downloading YOLO model...")
    
    # Create a simple script to download the model
    download_script = """
import torch
from ultralytics import YOLO

try:
    # This will download the model if it doesn't exist
    model = YOLO('yolov8n.pt')
    print("✅ YOLO model downloaded successfully")
except Exception as e:
    print(f"❌ Error downloading YOLO model: {e}")
    """
    
    try:
        exec(download_script)
        return True
    except Exception as e:
        print(f"❌ Error downloading YOLO model: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    print("📁 Setting up directories...")
    
    directories = [
        "models",
        "temp",
        "logs",
        "data"
    ]
    
    base_path = Path(__file__).parent
    
    for directory in directories:
        dir_path = base_path / directory
        dir_path.mkdir(exist_ok=True)
        print(f"   Created: {dir_path}")
    
    return True

def test_imports():
    """Test if all required packages can be imported"""
    print("🧪 Testing imports...")
    
    required_packages = [
        "cv2",
        "numpy",
        "PIL",
        "flask",
        "ultralytics",
        "easyocr",
        "requests",
        "pandas"
    ]
    
    failed_imports = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError as e:
            print(f"   ❌ {package}: {e}")
            failed_imports.append(package)
    
    if failed_imports:
        print(f"❌ Failed to import: {', '.join(failed_imports)}")
        return False
    
    print("✅ All packages imported successfully")
    return True

def create_env_file():
    """Create a sample .env file"""
    print("⚙️ Creating environment file...")
    
    env_content = """# AI Backend Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Model Configuration
YOLO_MODEL_PATH=yolov8n.pt
OCR_GPU=True
CONFIDENCE_THRESHOLD=0.5

# API Configuration
NFL_API_KEY=your_nfl_api_key_here
SPORTS_DATA_API_KEY=your_sports_data_api_key_here

# WebSocket Configuration
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=8765

# Processing Configuration
TARGET_FPS=30
FRAME_SKIP=2
MAX_DETECTIONS=10
"""
    
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"   Created: {env_file}")
    else:
        print(f"   Already exists: {env_file}")
    
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up AI Backend for NFL Player Detection")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup directories
    if not setup_directories():
        print("❌ Failed to setup directories")
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        print("❌ Failed to install requirements")
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("❌ Some packages failed to import")
        print("💡 Try running: pip install -r requirements.txt")
        sys.exit(1)
    
    # Download YOLO model
    if not download_yolo_model():
        print("⚠️ YOLO model download failed, but continuing...")
    
    # Create environment file
    create_env_file()
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Update the .env file with your API keys")
    print("2. Run: python app.py")
    print("3. Test the API at: http://localhost:5000/health")
    print("\n🏈 Ready to detect NFL players!")

if __name__ == "__main__":
    main()
