#!/bin/bash
./build.sh
npm pack
node_modules/typedoc/bin/typedoc src/index.ts

git add --all
git commit -m "sync"
git push

npm publish

mv sellquiz-*.tgz ../

echo "do not forget to update the version number of package.json and README.md!"
