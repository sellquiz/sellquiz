<?php

/******************************************************************************
 * SELL - SIMPLE E-LEARNING LANGUAGE                                          *
 *                                                                            *
 * Copyright (c) 2019-2021 TH Köln                                            *
 * Author: Andreas Schwenk, contact@compiler-construction.com                 *
 *                                                                            *
 * Partly funded by: Digitale Hochschule NRW                                  *
 * https://www.dh.nrw/kooperationen/hm4mint.nrw-31                            *
 *                                                                            *
 * GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007                         *
 *                                                                            *
 * This library is licensed as described in LICENSE, which you should have    *
 * received as part of this distribution.                                     *
 *                                                                            *
 * This software is distributed on "AS IS" basis, WITHOUT WARRENTY OF ANY     *
 * KIND, either impressed or implied.                                         *
 ******************************************************************************/

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// get path of nodejs
$nodejs_paths = array("/usr/bin/node", "/usr/local/bin/node", "/opt/homebrew/bin/node");
$nodejs_path = "";
foreach($nodejs_paths as $np) {
    ob_start();
    system("command -v " . $np);
    $output = ob_get_contents();
    ob_end_clean();
    if(strlen($output) > 0) {
        $nodejs_path = $np;
        break;
    }
}
if(strlen($nodejs_path)==0) {
    echo "Error: Nodejs not found!";
    exit();
}

// check, if input is given
if(isset($_POST["input"]) == false) {
    echo "Error: POST 'input' is not set! You must provide a JSON-string containing entries 'type', 'source', 'asserts'!";
    exit();
}

// create a temporary directory and store the input as JSON-file
$dir = "cache/" . random_int(0, PHP_INT_MAX) . "/";
$path = $dir . "input.json";
system('mkdir -p ' . $dir);
file_put_contents($path, $_POST["input"]);

// run service-prog.js with input as argument
ob_start();
// 2>&1 redirects stderr to stdout
system($nodejs_path . " service-prog.js " . $path . " 2>&1");
$output = ob_get_contents();
ob_end_clean();

// delete temporary directory
system('rm -rf ' . $dir);

// print result
echo "$output";

?>
