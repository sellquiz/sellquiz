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

import * as math from 'mathjs';
import { sellassert } from './sellassert.js';

export enum symtype {
    T_UNKNOWN = "T_UNKNOWN", 
    T_REAL = "T_REAL", 
    T_DOTS = "T_DOTS", 
    T_SET = "T_SET", 
    T_BOOL = "T_BOOL", 
    T_FUNCTION = "T_FUNCTION", 
    T_COMPLEX = "T_COMPLEX", 
    T_COMPLEX_SET = "T_COMPLEX_SET",
    T_MATRIX = "T_MATRIX", 
    T_MATRIX_DEF = "T_MATRIX_DEF", 
    T_MATRIX_TRANSPOSE = "T_MATRIX_TRANSPOSE",
    T_MATRIX_OF_FUNCTIONS = "T_MATRIX_OF_FUNCTIONS",
    T_STRING = "T_STRING", 
    T_STRING_LIST = "T_STRING_LIST",
    T_PROGRAMMING = "T_PROGRAMMING"
}

export class SellSymbol {

    type : symtype;
    value : any; // TODO
    precision : number;
    hint_html : string = '';

    constructor(type=symtype.T_UNKNOWN, value=null, precision=1e-9) {
        this.type = type;
        this.value = value;
        this.precision = precision;
    }

    exportDictionary(symid : string) {
        let d = {};
        d["id"] = symid;
        d["type"] = this.type;
        d["value"] = this.value.toString();
        d["precision"] = this.precision;
        d["hint"] = this.hint_html;
        return d;
    }

    importDictionary(d : any) {
        this.type = symtype[d["type"]];
        switch(this.type) {
            case symtype.T_REAL:
                this.value = parseFloat(d["value"]);
                break;
            default:
                sellassert(false, "SellSymbol:importFromDictionary(): UNIMPLMENTED");
        }
        this.precision = d["precision"];
        this.hint_html = d["hint"];
    }


    toAsciiMath() {
        let s = "";
        switch(this.type) {
            case symtype.T_BOOL:
                return this.value ? "true" : "false"; // TODO: language
            case symtype.T_UNKNOWN:
                return "ERROR";
            case symtype.T_REAL:
                return this.value;
            case symtype.T_DOTS:
                return "...";
            case symtype.T_SET:
            case symtype.T_COMPLEX_SET:
                s = "{ ";
                for(let i=0; i<this.value.length; i++)
                    s += (i>0?", ":"") + this.value[i].toAsciiMath();
                s += " }";
                return s;
            case symtype.T_FUNCTION:
                s = this.value.toString();
                return s;
            case symtype.T_COMPLEX:
                s = this.value.toString();
                //s = s.replace("i", "j"); // TODO: must be configurable
                return s;
            case symtype.T_MATRIX:
            case symtype.T_MATRIX_OF_FUNCTIONS:
                s = this.value.toString();
                s = s.replaceAll("[", "("); // TODO: must be configurable
                s = s.replaceAll("]", ")"); // TODO: must be configurable
                return s;
            default:
                sellassert(false, "unimplemented SellSymbol::toAsciiMath(..)");
        }
    }

}
