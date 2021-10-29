#!/bin/bash
cd ..
npm install
./build.sh
cd authoring
#ln -s ../../node_modules/ .
#ln -s ../../build .
rm -rf node_modules
rm -rf build
cp -r ../node_modules node_modules
cp -r ../build build
