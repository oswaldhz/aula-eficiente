#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
cd proyecto/backend
pip install -r requirements.txt

echo "=== Installing frontend dependencies ==="
cd ../frontend
npm install

echo "=== Building frontend ==="
npm run build

echo "=== Build complete ==="
