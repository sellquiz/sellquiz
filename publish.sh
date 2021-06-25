#!/bin/bash
node_modules/typedoc/bin/typedoc src/index.ts
npm run build
npm pack
npm publish
echo "do not forget to update the version number of package.json!"
