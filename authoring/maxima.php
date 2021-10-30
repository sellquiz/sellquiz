<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$maxima_path = "/usr/local/bin/maxima"; // TODO: depends on system

// create a temporary directory and store the input
$dir = "cache/" . random_int(0, PHP_INT_MAX) . "/";
$path = $dir . "maxima-input.txt";
system('mkdir -p ' . $dir);    // TODO: output dev-error, if not writeable
file_put_contents($path, $_POST["input"]);

// run maxima
ob_start();
system($maxima_path . " -q -b " . $path);
$output = ob_get_contents();
ob_end_clean();

// delete temporary directory
system('rm -rf ' . $dir);

// print result
echo $output;

?>
