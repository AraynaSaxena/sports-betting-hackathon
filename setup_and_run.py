#!/usr/bin/env python3
"""
Complete setup and run script for the Sports Betting AI application.
This script handles both Python and React setup, then runs everything.
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_step(step, message):
    print(f"{Colors.OKBLUE}[{step}]{Colors.ENDC} {message}")

def print_success(message):
    print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}⚠️  {message}{Colors.ENDC}")

def run_command(cmd, cwd=None, check=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=check, 
                              capture_output=True, text=True)
        return True, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def check_python_version():
    """Check if Python version is adequate"""
    print_step("1", "Checking Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro} ✓")
        return True
    else:
        print_error(f"Python 3.8+ required, found {version.major}.{version.minor}.{version.micro}")
        return False

def check_node_version():
    """Check if Node.js is installed"""
    print_step("2", "Checking Node.js version...")
    success, stdout, stderr = run_command("node --version", check=False)
    if success:
        version = stdout.strip()
        print_success(f"Node.js {version} ✓")
        return True
    else:
        print_error("Node.js not found. Please install Node.js from https://nodejs.org/")
        return False

def setup_python_env():
    """Set up Python virtual environment and install dependencies"""
    print_step("3", "Setting up Python environment...")
    
    venv_path = Path(".venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        success, _, stderr = run_command(f"{sys.executable} -m venv .venv")
        if not success:
            print_error(f"Failed to create virtual environment: {stderr}")
            return False
        print_success("Virtual environment created")
    
    # Check if requirements are installed
    scripts_dir = Path("scripts")
    if not scripts_dir.exists():
        print_error("scripts/ directory not found")
        return False
    
    requirements_file = scripts_dir / "requirements.txt"
    if not requirements_file.exists():
        print_error("requirements.txt not found in scripts/")
        return False
    
    # Install Python requirements
    print("Installing Python dependencies...")
    if os.name == 'nt':  # Windows
        pip_cmd = ".venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_cmd = ".venv/bin/pip"
    
    success, stdout, stderr = run_command(f"{pip_cmd} install -r scripts/requirements.txt")
    if not success:
        print_error(f"Failed to install Python requirements: {stderr}")
        return False
    
    print_success("Python dependencies installed")
    return True

def setup_react_env():
    """Set up React environment and install dependencies"""
    print_step("4", "Setting up React environment...")
    
    package_json = Path("package.json")
    if not package_json.exists():
        print_error("package.json not found")
        return False
    
    # Install Node dependencies
    print("Installing Node.js dependencies...")
    success, stdout, stderr = run_command("npm install")
    if not success:
        print_error(f"Failed to install Node dependencies: {stderr}")
        return False
    
    print_success("React dependencies installed")
    return True

def check_video_file():
    """Check if video file exists"""
    print_step("5", "Checking for video file...")
    
    video_path = Path("public/game-video.mp4")
    if video_path.exists():
        size_mb = video_path.stat().st_size / (1024 * 1024)
        print_success(f"Video file found ({size_mb:.1f} MB)")
        return True
    else:
        print_warning("Video file not found at public/game-video.mp4")
        print("You can:")
        print("  1. Add your video file as public/game-video.mp4")
        print("  2. Update VIDEO_IN path in scripts/config.py")
        print("  3. Continue without video (demo mode will work)")
        return False

def run_overlay_generation():
    """Run the Python overlay generation script"""
    print_step("6", "Running overlay generation...")
    
    scripts_dir = Path("scripts")
    overlay_script = scripts_dir / "Prepare_overlay.py"
    
    if not overlay_script.exists():
        print_error("Prepare_overlay.py not found in scripts/")
        return False
    
    # Check if video exists before running
    video_exists = check_video_file()
    if not video_exists:
        response = input("Continue without video file? (y/n): ").lower().strip()
        if response != 'y':
            print("Skipping overlay generation. You can run it later with:")
            print("cd scripts && python Prepare_overlay.py")
            return True
    
    print("Generating player overlays...")
    if os.name == 'nt':  # Windows
        python_cmd = "../.venv/Scripts/python"
    else:  # Unix/Linux/macOS
        python_cmd = "../.venv/bin/python"
    
    success, stdout, stderr = run_command(f"{python_cmd} Prepare_overlay.py", cwd="scripts")
    if success:
        print_success("Overlay generation completed")
        print("Generated files:")
        print("  - public/overlay.json")
        print("  - public/overlay_annotated.mp4")
        return True
    else:
        print_warning("Overlay generation failed (this is OK for demo mode)")
        print(f"Error: {stderr}")
        return False

def start_react_app():
    """Start the React development server"""
    print_step("7", "Starting React application...")
    
    print("🚀 Starting React development server...")
    print("The app will open in your browser at http://localhost:3000")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run("npm start", shell=True, check=True)
    except KeyboardInterrupt:
        print("\n👋 Shutting down React server...")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to start React server: {e}")
        return False
    
    return True

def main():
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("🏈 Sports Betting AI - Complete Setup & Run")
    print("=" * 50)
    print(f"{Colors.ENDC}")
    
    # Check prerequisites
    if not check_python_version():
        return 1
    
    if not check_node_version():
        return 1
    
    # Setup environments
    if not setup_python_env():
        return 1
    
    if not setup_react_env():
        return 1
    
    # Optional: Generate overlays
    print(f"\n{Colors.OKCYAN}Optional: Generate Player Overlays{Colors.ENDC}")
    response = input("Generate player overlays now? (y/n): ").lower().strip()
    if response == 'y':
        run_overlay_generation()
    else:
        print("Skipping overlay generation. You can run it later with:")
        print("cd scripts && source ../.venv/bin/activate && python Prepare_overlay.py")
    
    print(f"\n{Colors.OKGREEN}🎉 Setup Complete!{Colors.ENDC}")
    print("\nWhat's ready:")
    print("✅ Python environment with ML dependencies")
    print("✅ React application with all packages")
    print("✅ Sports betting interface")
    print("✅ Authentication system")
    print("✅ Computer vision simulation")
    
    print(f"\n{Colors.OKCYAN}Starting the application...{Colors.ENDC}")
    
    # Start React app
    start_react_app()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
