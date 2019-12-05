#!/bin/bash

# Be sure to be at the root of the project.
DIRECTORY=$(
	cd "$(dirname "${BASH_SOURCE[0]}")" || exit
	pwd -P
)
cd "$DIRECTORY" || exit
cd ..

MODE="production"

while getopts ":hd" opt; do
	case ${opt} in
	h)
		echo "Usage:"
		echo "    build           Run the builder."
		echo "    build -d        Run the builder for development, not optimized."
		echo "    build -h        Display this help."
		exit 0
		;;
	d)
		MODE="development"
		;;
	\?)
		echo "Usage: build [-h] [-d]"
		exit 0
		;;
	esac
done

echo "Removing the build directory..."
rm -rf build

echo "Creating JavaScript bundles..."
webpack --mode $MODE --config dev/webpack.config.js

echo "Creating browser extension directories..."
cp -r src/extension/chrome build/github-rte-chrome
cp -r src/extension/firefox build/github-rte-firefox

echo "Removing manifest comments..."
./node_modules/.bin/strip-json-comments src/extension/chrome/manifest.json > build/github-rte-chrome/manifest.json
./node_modules/.bin/strip-json-comments src/extension/firefox/manifest.json > build/github-rte-firefox/manifest.json

echo "Copying files to the browser extensions..."
cp build/js/*.* build/github-rte-chrome
cp src/css/*.* build/github-rte-chrome
cp src/extension/icons/*.* build/github-rte-chrome

cp build/js/*.* build/github-rte-firefox
cp src/css/*.* build/github-rte-firefox
cp src/extension/icons/*.* build/github-rte-firefox

if [ "$MODE" = "production" ]; then
	echo "Creating extension files..."
	zip -jq build/github-rte-chrome.zip build/github-rte-chrome/*.*
	zip -jq build/github-rte-firefox.xpi build/github-rte-firefox/*.*
fi

echo "Cleaning up..."
rm -rf build/js

GZIP_SIZE=$( gzip -c build/github-rte-chrome/github-rte.js | wc -c )

echo "Estimated gzip size of the build script:$GZIP_SIZE bytes."
