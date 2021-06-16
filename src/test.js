/*import * as Sell from './index.js';

let sell = new Sell.Sell();
sell.hello();
*/

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

let questions = `Matrizenoperationen

    a := { 1, 2, 3 }
    A, B in MM(3 x 3 | a )
    C := A - B
    input rows := resizable
    input cols := resizable

Berechne $ A - B = #C $
    ? Erklärungstext
`;

questions = `Ableitungen

    a, b in { 3, 4, ..., 8 }
    f1(x) := a * exp(b*x)
    f1_deriv(x) := diff(f1, x)

$ f(x) = f1 $
$ f'(x) = #(f1_deriv) $
`;

questions = `Addition  #simple

    a, b, c, d in { 1, 2, ..., 5 }
    ee in { -1, 1 }
    a := a * ee
    z_1 := a + b * i
    z_2 := c + d * i

Seien $ "z_1" = z_1 $ und $ "z_2" = z_2 $ komplexe Zahlen.

* Berechnen Sie die folgende __Summe__ und geben Sie das Ergebnis in Normalform an:
  __bold__ $ x_3^4 "z_1" + "z_2" = #(z_1+z_2) $`;


questions = fs.readFileSync('examples/ma2-4.txt', 'utf8');


let ok = true;

let env = "standalone";
//let env = "moodle";

var sell = new Sell.Sell("en", "sell", true/*debug mode*/, env);

ok = sell.importQuestions(questions);
console.log(sell.log);

if(ok)
    console.log(sell.html);

assert(ok);
