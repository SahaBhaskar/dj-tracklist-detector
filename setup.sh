#!/usr/bin/env bash
set -e

echo "=== DJ Tracklist Detector — Setup ==="

# 1. Check for Homebrew (Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command -v brew &>/dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi

  if ! command -v node &>/dev/null; then
    echo "Installing Node.js via Homebrew..."
    brew install node
  fi
fi

echo "Node $(node -v) / npm $(npm -v) found."

echo "Installing dependencies..."
cd "$(dirname "$0")"
npm install

echo ""
echo "✓ Setup complete! Run the app with:"
echo "  npm start"
echo ""
echo "To build distributable .dmg / .exe:"
echo "  npm run dist:mac    (macOS)"
echo "  npm run dist:win    (Windows — run on Windows or use Wine)"
