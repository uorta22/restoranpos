#!/bin/bash

# Restaurant POS - iOS Simulator Launcher
# Bu script iOS Simulator'ü başlatır ve uygulamayı açar

echo "🚀 Starting iOS Simulator..."

# Check if Xcode is installed
if ! command -v xcrun &> /dev/null; then
    echo "❌ Xcode not found. Please install Xcode from App Store."
    exit 1
fi

# List available simulators
echo "📱 Available Simulators:"
xcrun simctl list devices available | grep -E "iPad|iPhone"

# Start the default iPad simulator
echo ""
echo "🎯 Launching iPad Pro 12.9\" simulator..."
open -a Simulator --args -CurrentDeviceUDID $(xcrun simctl list devices available | grep "iPad Pro (12.9-inch)" | head -1 | grep -o '[0-9A-F-]\{36\}')

# Wait for simulator to boot
echo "⏳ Waiting for simulator to boot..."
sleep 5

# Get local network address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
PORT=3001

echo "✅ Simulator started!"
echo ""
echo "📍 Server running at:"
echo "   http://${LOCAL_IP}:${PORT}"
echo ""
echo "🌐 Opening Safari in simulator..."

# Open URL in simulator's Safari
xcrun simctl openurl booted "http://${LOCAL_IP}:${PORT}"

echo ""
echo "✨ Done! Check the simulator screen."
echo ""
echo "💡 Tips:"
echo "   - Use Cmd+K to toggle keyboard"
echo "   - Use Cmd+Left/Right to rotate"
echo "   - Use Cmd+1,2,3 to change device size"
