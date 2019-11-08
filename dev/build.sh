#!/bin/bash

# Be sure to be at the root of the project.
DIRECTORY=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$DIRECTORY"
cd ..

echo "Removing the build directory..."
rm -rf build

echo "Creating the JavaScript bundles..."
webpack --mode development --config dev/webpack.config.js

echo "Copying CSS files..."
cp src/css/*.css build

echo "Creating browser extension directories..."
cp -r src/extension-chrome build/extension-chrome

echo "Copying bundled scripts to the browser extensions..."
cp build/*.js build/extension-chrome
cp build/*.map build/extension-chrome
cp build/*.css build/extension-chrome
