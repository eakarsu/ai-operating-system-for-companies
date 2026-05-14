#!/bin/bash


echo "=== CompanyOS - AI Operating System ==="

# Kill any lingering processes from previous runs.
# Three layers: by name (catches detached nodemon/vite that aren't bound yet),
# by project path (catches strays), then by port (final guard).
echo "Cleaning up old processes..."
pkill -9 -f "nodemon server.js"        2>/dev/null || true
pkill -9 -f "vite --port 5176"         2>/dev/null || true
pkill -9 -f "company-os-backend"       2>/dev/null || true
pkill -9 -f "company-os-frontend"      2>/dev/null || true
pkill -9 -f "ai-operating-system-for-companies/backend"  2>/dev/null || true
pkill -9 -f "ai-operating-system-for-companies/frontend" 2>/dev/null || true

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing PIDs on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    lsof -ti:$port >/dev/null 2>&1 || return 0
    sleep 0.3
  done
  echo "WARNING: port $port still busy after wait"
}
free_port 3016
free_port 5176

# Setup database
createdb company_os_db 2>/dev/null || echo "DB already exists"
psql company_os_db < backend/db/schema.sql
psql company_os_db < backend/db/seed.sql

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Copy env
cp .env backend/.env 2>/dev/null || true

# Start backend
( cd backend && npm start ) &

# Start frontend
( cd frontend && npm run dev -- --port 5176 ) &

echo ""
echo "CompanyOS running:"
echo "  Backend:  http://localhost:3016"
echo "  Frontend: http://localhost:5176"
echo ""
echo "Demo login: demo@companyos.ai / demo123"
