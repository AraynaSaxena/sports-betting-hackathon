#!/bin/bash
# cv_system/api/start_backend.sh
# Startup script that handles port conflicts automatically

echo "Starting Football Detection Backend..."

# Kill any existing process on port 8001
echo "Checking for existing processes on port 8001..."
PID=$(lsof -ti:8001)
if [ ! -z "$PID" ]; then
    echo "Killing existing process $PID on port 8001"
    kill -9 $PID
    sleep 2
fi

# Verify port is free
if lsof -i:8001 > /dev/null 2>&1; then
    echo "ERROR: Port 8001 still in use. Trying alternative cleanup..."
    sudo lsof -ti:8001 | xargs sudo kill -9
    sleep 2
fi

# Start the backend
echo "Starting backend on port 8001..."
cd "$(dirname "$0")"
python main.py