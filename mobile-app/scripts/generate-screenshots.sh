#!/bin/bash
# generate-screenshots.sh
# Purpose: Automate or guide the process of capturing App Store screenshots

echo "📸 Starting Screenshot Session..."
echo "Ensure you have the iOS Simulator running (iPhone 15 Pro Max recommended)"

# Create output directory
mkdir -p ./fastlane/screenshots

echo "--- Instructions ---"
echo "1. Run the app: npx expo run:ios"
echo "2. Navigate to the screens: Login, TPV, Tables, Dashboard"
echo "3. Press CMD+S in Simulator to save screen."
echo "4. Move saved screenshots to ./fastlane/screenshots"
echo "--------------------"

# Optional: If using Detox/Maestro for automation
# maestro test .maestro/screenshots.yaml
