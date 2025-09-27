#!/usr/bin/env python3
"""
Simple runner script for the overlay preparation tool.
This script handles setup and provides helpful error messages.
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    required_packages = [
        'cv2', 'ultralytics', 'supervision', 'paddleocr', 'numpy'
    ]
    
    missing = []
    for package in required_packages:
        try:
            if package == 'cv2':
                import cv2
            elif package == 'ultralytics':
                import ultralytics
            elif package == 'supervision':
                import supervision
            elif package == 'paddleocr':
                import paddleocr
            elif package == 'numpy':
                import numpy
        except ImportError:
            missing.append(package)
    
    return missing

def install_requirements():
    """Install requirements using pip"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def main():
    print("🏈 NFL Player Overlay Generator")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("Prepare_overlay.py"):
        print("❌ Error: Prepare_overlay.py not found!")
        print("Please run this script from the scripts/ directory")
        return 1
    
    # Check requirements
    missing = check_requirements()
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print("Installing requirements...")
        if not install_requirements():
            print("❌ Failed to install requirements. Please install manually:")
            print("pip install -r requirements.txt")
            return 1
        print("✅ Requirements installed successfully!")
    
    # Import and run the main script
    try:
        from Prepare_overlay import main as run_overlay
        success = run_overlay()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ Error running overlay preparation: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
