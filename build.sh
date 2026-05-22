#!/usr/bin/env bash
set -e

echo "=== Installing Python dependencies ==="
cd proyecto/backend
pip install --no-cache-dir -r requirements.txt

echo "=== Ensure correct PyJWT (not the wrong 'jwt' package) ==="
pip install --upgrade --no-cache-dir PyJWT cryptography
pip uninstall -y jwt 2>/dev/null || true

echo "=== Installing frontend dependencies ==="
cd ../frontend
npm install

echo "=== Building frontend ==="
npm run build

echo "=== Build complete ==="
