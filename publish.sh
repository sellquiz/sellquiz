#!/bin/bash
npm run build
npm pack
npm publish
echo "do not forget to update version number of package.json"
