#!/bin/bash

# Configuration
VERSION=$(grep '"version":' ./extension/manifest.json | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
BUILD_DIR="./builds"
BUILD_NAME="jobos_extension_v$VERSION.zip"

# Preparation
mkdir -p "$BUILD_DIR"
echo "--- Initializing Extension Build v$VERSION ---"

# Step 1: Clean build
rm -f "$BUILD_DIR/$BUILD_NAME"

# Step 2: ZIP the core extension folder
# -r: recursive
# -X: ignore extra file attributes (cleaner for Store)
echo "Packing /extension into $BUILD_DIR/$BUILD_NAME..."
zip -r -X "$BUILD_DIR/$BUILD_NAME" ./extension -x "*/.*" "*/node_modules/*" "*README.md*" "*/test/*"

echo "--- Build Complete! ---"
echo "Asset: $BUILD_DIR/$BUILD_NAME"
