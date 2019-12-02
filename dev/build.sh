#!/bin/bash

# Be sure to be at the root of the project.
DIRECTORY=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit
  pwd -P
)
cd "$DIRECTORY" || exit
cd ..

echo "Removing the build directory..."
rm -rf build

echo "Creating JavaScript bundles..."
webpack --mode development --config dev/webpack.config.js

echo "Creating browser extension directories..."
cp -r src/extension-chrome build/extension-chrome
cp -r src/extension-firefox build/extension-firefox

echo "Removing manifest comments..."
./node_modules/.bin/strip-json-comments src/extension-chrome/manifest.json > build/extension-chrome/manifest.json
./node_modules/.bin/strip-json-comments src/extension-firefox/manifest.json > build/extension-firefox/manifest.json

echo "Copying files to the browser extensions..."
cp build/js/*.* build/extension-chrome
cp src/css/*.* build/extension-chrome
cp src/icons/*.* build/extension-chrome

cp build/js/*.* build/extension-firefox
cp src/css/*.* build/extension-firefox
cp src/icons/*.* build/extension-firefox

echo "Creating extension files..."
zip -jq build/github-rte-chrome.zip build/extension-chrome/*.*
zip -jq build/github-rte-firefox.xpi build/extension-firefox/*.*

echo "Cleaning up..."
rm -rf build/js
