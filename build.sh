#!/bin/bash
npm run build
node_modules/uglify-js/bin/uglifyjs src/sellquiz.ide.js > build/js/sellquiz.ide.min.js
