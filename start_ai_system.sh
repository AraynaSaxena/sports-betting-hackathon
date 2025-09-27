#!/bin/bash

# 🚀 AI NFL Player Detection System Startup Script
# This script sets up and starts the complete AI system

set -e  # Exit on any error

echo "🏈 Starting AI NFL Player Detection System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

print_status "Python 3 found"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

print_status "Node.js found"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Project directory confirmed"

# Setup AI Backend
echo ""
echo "🤖 Setting up AI Backend..."
echo "----------------------------"

cd ai_backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_info "Installing Python dependencies..."
if pip install -r requirements.txt > /dev/null 2>&1; then
    print_status "Python dependencies installed"
else
    print_warning "Some Python dependencies may have failed to install"
    print_info "Continuing anyway..."
fi

# Run setup script
print_info "Running AI model setup..."
if python setup.py; then
    print_status "AI model setup completed"
else
    print_warning "AI model setup had some issues, but continuing..."
fi

# Test the AI model
print_info "Testing AI model..."
if python test_model.py > test_results.log 2>&1; then
    print_status "AI model tests passed"
    # Show summary of test results
    echo ""
    echo "📊 Test Results Summary:"
    tail -n 10 test_results.log | grep -E "(✅|❌|🎯)"
else
    print_warning "AI model tests had some issues"
    print_info "Check test_results.log for details"
fi

cd ..

# Setup React Frontend
echo ""
echo "⚛️ Setting up React Frontend..."
echo "-------------------------------"

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    if npm install > /dev/null 2>&1; then
        print_status "Node.js dependencies installed"
    else
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
else
    print_status "Node.js dependencies already installed"
fi

# Start the system
echo ""
echo "🚀 Starting the AI System..."
echo "============================"

# Function to cleanup background processes
cleanup() {
    print_info "Shutting down AI system..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_status "AI system shut down"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start AI Backend
print_info "Starting AI Backend on http://localhost:5000..."
cd ai_backend
source venv/bin/activate
python app.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_status "AI Backend is running"
else
    print_warning "AI Backend may not be fully ready yet"
fi

# Start React Frontend
print_info "Starting React Frontend on http://localhost:3000..."
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "🎉 AI System Started Successfully!"
echo "=================================="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🤖 AI Backend: http://localhost:5000"
echo "📊 Backend Health: http://localhost:5000/health"
echo ""
echo "🎮 Usage Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Toggle between 'DEMO MODE' and 'AI MODE'"
echo "3. In AI MODE, click 'AI ON' to start real-time detection"
echo "4. Hover over detected players to see stats"
echo "5. Click on players to generate AI betting questions"
echo ""
echo "📋 System Status:"
echo "• AI Backend PID: $BACKEND_PID"
echo "• React Frontend PID: $FRONTEND_PID"
echo "• Logs: backend.log, frontend.log"
echo ""
echo "Press Ctrl+C to stop the system"
echo ""

# Keep the script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "AI Backend stopped unexpectedly"
        print_info "Check ai_backend/backend.log for details"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "React Frontend stopped unexpectedly"
        print_info "Check frontend.log for details"
        cleanup
    fi
    
    sleep 10
done
