#!/bin/bash

GZIP_SIZE=$( gzip -c build/github-rte-chrome/github-rte.js | wc -c )

echo "Estimated gzip size of the build script:$GZIP_SIZE bytes."
