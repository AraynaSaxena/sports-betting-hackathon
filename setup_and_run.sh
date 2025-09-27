#!/bin/bash

# Sports Betting AI - Complete Setup & Run Script
# This script sets up both Python and React environments and runs the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[$1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${CYAN}🏈 Sports Betting AI - Complete Setup & Run${NC}"
echo "=================================================="

# Step 1: Check Python
print_step "1" "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Found $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Step 2: Check Node.js
print_step "2" "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Found Node.js $NODE_VERSION"
else
    print_error "Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi

# Step 3: Setup Python environment
print_step "3" "Setting up Python environment..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    print_success "Virtual environment created"
fi

echo "Installing Python dependencies..."
source .venv/bin/activate
pip install -r scripts/requirements.txt
print_success "Python dependencies installed"

# Step 4: Setup React environment
print_step "4" "Setting up React environment..."
echo "Installing Node.js dependencies..."
npm install
print_success "React dependencies installed"

# Step 5: Check for video file
print_step "5" "Checking for video file..."
if [ -f "public/game-video.mp4" ]; then
    SIZE=$(du -h "public/game-video.mp4" | cut -f1)
    print_success "Video file found ($SIZE)"
    HAS_VIDEO=true
else
    print_warning "Video file not found at public/game-video.mp4"
    echo "You can:"
    echo "  1. Add your video file as public/game-video.mp4"
    echo "  2. Update VIDEO_IN path in scripts/config.py"
    echo "  3. Continue without video (demo mode will work)"
    HAS_VIDEO=false
fi

# Step 6: Optional overlay generation
echo ""
echo -e "${CYAN}Optional: Generate Player Overlays${NC}"
if [ "$HAS_VIDEO" = true ]; then
    read -p "Generate player overlays now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "6" "Running overlay generation..."
        cd scripts
        source ../.venv/bin/activate
        python Prepare_overlay.py
        cd ..
        print_success "Overlay generation completed"
    else
        echo "Skipping overlay generation. You can run it later with:"
        echo "cd scripts && source ../.venv/bin/activate && python Prepare_overlay.py"
    fi
else
    echo "Skipping overlay generation (no video file)"
fi

# Step 7: Setup complete
echo ""
print_success "🎉 Setup Complete!"
echo ""
echo "What's ready:"
echo "✅ Python environment with ML dependencies"
echo "✅ React application with all packages"
echo "✅ Sports betting interface"
echo "✅ Authentication system"  
echo "✅ Computer vision simulation"

echo ""
echo -e "${CYAN}🚀 Starting the application...${NC}"
echo "The app will open in your browser at http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start React app
npm start
