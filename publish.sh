#!/bin/bash
./build.sh
npm pack
node_modules/typedoc/bin/typedoc src/index.ts

git add --all
git commit -m "sync"
git push

npm publish

mv sellquiz-*.tgz ../

# TODO: this script should show the old version number, ask for a new version (command line) and write the new one to package.json
echo "do not forget to update the version number of package.json and README.md!"
