/******************************************************************************
 * SELL - SIMPLE E-LEARNING LANGUAGE                                          *
 *                                                                            *
 * Copyright (c) 2019-2021 TH Köln                                            *
 * Author: Andreas Schwenk, contact@compiler-construction.com                 *
 *                                                                            *
 * Funded by: Digitale Hochschule NRW                                         *
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

import * as Sell from './index.js';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const assert = require("assert");
const fs = require("fs");

/*let questions = `Matrizenoperationen

    a := { 1, 2, 3 }
    A, B in MM(3 x 3 | a )
    C := A - B
    input rows := resizable
    input cols := resizable

Berechne $ A - B = #C $
    ? Erklärungstext
`;*/

let questions = fs.readFileSync('examples/ma2-4.txt', 'utf8');
let env = "standalone";
var sell = new Sell.Sell("en", "sell", true/*debug mode*/, env);
let ok = sell.importQuestions(questions);
console.log(sell.log);
if(ok)
    console.log(sell.html);
assert(ok);

// ----- test in browser -----
var open = require("open");
const { exec } = require("child_process");

// rebuild package
await exec("npm run build");

// create HTML document
let html = fs.readFileSync('snippets/index.html', 'utf8');
questions = questions.replaceAll('`', '\\`');
html = html.replace('$SELL_CODE$', questions);
fs.writeFileSync('tmp-sell.html', html);

// start HTTP-server  (NOT necessary, since HTML file is static!)
//await exec("node node_modules/http-server/bin/http-server");

// open browser
//open("http://localhost:8080/tmp-sell.html", {app: {name: 'firefox'}});
open("./tmp-sell.html", {app: {name: 'firefox'}});
