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

import * as fs from 'fs';
import { exec } from 'child_process';
import { SellQuiz } from './quiz.js';
import { sellassert } from './sellassert.js';

if(process.argv.length != 3) {
    console.log("usage: node test.js SELL_QUESTION_PATH");
    process.exit(-1);
}
let questions_path = process.argv[2];

let questions = fs.readFileSync(questions_path, 'utf8');
let debugMode = true;

var sell = new SellQuiz(debugMode);
let ok = sell.importQuestions(questions);
console.log(sell.log);
if(ok)
    console.log(sell.html);
sellassert(ok);

// ----- test in browser -----

// rebuild package
//exec("npm run build");
exec("./build.sh");

// create HTML document
let html = fs.readFileSync('snippets/index-test.html', 'utf8');
questions = questions.replaceAll('`', '\\`');
html = html.replaceAll('$SELL_CODE$', questions);
let timestamp = new Date().getTime();
html = html.replaceAll('$NOW$', ''+timestamp);
fs.writeFileSync('test-sell.html', html);

console.log("--- OPEN FILE  'test-sell.html'  IN YOUR WEB BROWSER ---");
console.log("In case your quiz contains programming tasks, 'test-sell.html' must run on a webserver:");
console.log("Run e.g. 'php -S localhost:8000' from the directory that contains 'test-sell.html'")
console.log("  and then open 'localhost:8000/test-sell.html' in your web browser.")
