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

// prog := programming

import { symtype, SellSymbol } from './symbol.js';
import { SellQuiz } from './quiz.js';

export class ParseProg {

    p : SellQuiz;

    constructor(parent : SellQuiz) {
        this.p = parent;
    }

    // prog =
    //   ("JavaBlock"|"JavaMethod"|"Python") ID "\n"
    //      "§CODE2_START" 
    //          (prog_given|prog_assert) 
    //      "§CODE2_END";
    parseProg() : void {
        let type = "";
        if(this.p.is("JavaBlock"))
            type = "JavaBlock";
        else if(this.p.is("JavaMethod"))
            type = "JavaMethod";
        else if(this.p.is("Python"))
            type = "Python";
        else
            this.p.err("unknown programming type " + this.p.tk);
        this.p.next();
        this.p.ident();
        let sym_id = this.p.id;
        this.p.terminal('§EOL');
        this.p.terminal('§CODE2_START');
        let code_given = "";
        let assert_list = [];
        while(this.p.is("given") || this.p.is("assert")) {
            if(this.p.is("given"))
                code_given += this.parseProgGiven();
            else
                assert_list.push(this.parseProgAssert());
        }
        this.p.terminal('§CODE2_END');
        this.p.q.symbols[sym_id] = new SellSymbol(symtype.T_PROGRAMMING, {
            type: type,
            given: code_given,
            asserts: assert_list
        });
    }

    // prog_given =
    //   "given" "'" ANY "'" "\n";
    parseProgGiven() : string {
        this.p.terminal("given");
        this.p.terminal("'");
        this.p.parseWhitespaces = true;
        let given_str = '';
        while(!this.p.is("'") && !this.p.is('§END')) {
            given_str += this.p.tk;
            this.p.next();
        }
        this.p.terminal("'");
        this.p.parseWhitespaces = false;
        this.p.terminal('§EOL');
        return given_str + "\n";
    }

    // prog_assert =
    //   "assert" "'" ANY "'" "\n";
    parseProgAssert() : string {
        this.p.terminal("assert");
        this.p.terminal("'");
        this.p.parseWhitespaces = true;
        let assert_str = '';
        while(!this.p.is("'") && !this.p.is('§END')) {
            assert_str += this.p.tk;
            this.p.next();
        }
        this.p.terminal("'");
        this.p.parseWhitespaces = false;
        this.p.terminal('§EOL');
        return assert_str;
    }

}
