#!/bin/bash
if ! command -v node &> /dev/null
then
    echo "Error: nodejs was not found: run e.g. 'sudo apt-install nodejs'"
    exit
fi
if ! command -v npm &> /dev/null
then
    echo "Error: npm was not found: run e.g. 'sudo apt-install npm'"
    exit
fi
if ! command -v python3 &> /dev/null
then
    echo "Error: python3 was not found: run e.g. 'sudo apt-install python3'"
    exit
fi
if ! command -v javac &> /dev/null
then
    echo "Warning: javac was not found: java-programming exercises will not run on this machine: run e.g. 'sudo apt-install default-jdk'"
fi

# TODO: check, if list is complete

npm install
