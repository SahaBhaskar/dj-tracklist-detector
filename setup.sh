#!/usr/bin/env bash
set -e

echo "=== DJ Tracklist Detector — Setup ==="

if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command -v brew &>/dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  if ! command -v node &>/dev/null; then
    echo "Installing Node.js..."
    brew install node
  fi
fi

echo "Node $(node -v) / npm $(npm -v)"

cd "$(dirname "$0")"
npm install

echo ""
echo "✓ Done! Start the app with:"
echo "  npm start"
echo ""
echo "Then open http://localhost:3000 in your browser."
