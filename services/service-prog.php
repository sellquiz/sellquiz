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

if(isset($_GET["input"]) == false) {
    echo "Error: parameter 'input' is not set! You must provide a JSON-string containing entries 'type', 'source', 'asserts'!";
    echo "Example: URL/service-prog.php?input={%22type%22:%22JavaBlock%22,%22source%22:%22double%20x%20=%201.23;\nString%20text%20=%20\%22hallo\%22;%22,%22asserts%22:[%22x%20==%201.23%22,%20%22text.equals(\%22hallo\%22)%22]}";
    exit();
}

$input_json = $_GET["input"];

$file = tmpfile();
$path = stream_get_meta_data($file)['uri'];

fwrite($file, $input_json);

ob_start();

// 2>&1 redirects stderr to stdout
system("/usr/local/bin/node service-prog.js " . $path . " 2>&1");
$output = ob_get_contents();

ob_end_clean();

echo "$output";

?>