#!/bin/bash

GZIP_SIZE=$( gzip -c build/github-writer-chrome/github-writer.js | wc -c )

echo "Estimated gzip size of the build script:$GZIP_SIZE bytes."
