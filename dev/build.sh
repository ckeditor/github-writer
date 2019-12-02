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
cp -r src/extension-chrome build/extension-chrome
cp -r src/extension-firefox build/extension-firefox

echo "Removing manifest comments..."
./node_modules/.bin/strip-json-comments src/extension-chrome/manifest.json >build/extension-chrome/manifest.json
./node_modules/.bin/strip-json-comments src/extension-firefox/manifest.json >build/extension-firefox/manifest.json

echo "Copying files to the browser extensions..."
cp build/js/*.* build/extension-chrome
cp src/css/*.* build/extension-chrome
cp src/icons/*.* build/extension-chrome

cp build/js/*.* build/extension-firefox
cp src/css/*.* build/extension-firefox
cp src/icons/*.* build/extension-firefox

if [ "$MODE" = "production" ]; then
	echo "Creating extension files..."
	zip -jq build/github-rte-chrome.zip build/extension-chrome/*.*
	zip -jq build/github-rte-firefox.xpi build/extension-firefox/*.*
fi

echo "Cleaning up..."
rm -rf build/js

GZIP_SIZE=$( gzip -c build/extension-chrome/github-rte.js | wc -c )

echo "Estimated gzip size of the build script:$GZIP_SIZE bytes."
