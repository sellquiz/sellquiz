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

$nodejs_path = "/usr/local/bin/node";

// check if path is valid. If not, change it (yet only works for Apple M1)
ob_start();
$output = ob_get_contents();
system("command -v " . $nodejs_path);
ob_end_clean();
if(strlen($output) == 0)
    $nodejs_path = "/opt/homebrew/bin/node";

if(isset($_POST["input"]) == false) {
    echo "Error: POST 'input' is not set! You must provide a JSON-string containing entries 'type', 'source', 'asserts'!";
    exit();
}

$input_json = $_POST["input"];

$dir = "cache/" . random_int(0, PHP_INT_MAX) . "/";
$path = $dir . "input.json";
system('mkdir -p ' . $dir);
file_put_contents($path, $input_json);

ob_start();
// 2>&1 redirects stderr to stdout
system($nodejs_path . " service-prog.js " . $path . " 2>&1");
$output = ob_get_contents();
ob_end_clean();

system('rm -rf ' . $dir);

echo "$output";

?>
