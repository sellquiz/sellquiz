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
import { symtype, SellSymbol } from './symbol.js';
import { Lexer } from './lex.js';
import * as LinAlg from './linalg.js';
import { SellSymTerm, SellSymTerm_Matrix } from './symbolic.js';

import { SellQuiz } from './quiz.js';

export class ParseCode {

    p : SellQuiz;
    
    constructor(parent : SellQuiz) {
        this.p = parent;
    }

    getFunctionList() {
        return ['abs', 'binomial', 'integrate', 'conj', 'sqrt', 'xgcd', 'det',
            'rank', 'inv', 'eye', 
            'eigenvalues_sym', 'triu', 'sin', 'cos', 'asin', 'acos', 
            'tan', 'atan', 'norm2', 'dot', 'cross', 
            'linsolve', 'is_zero', 
            'min', 'max'];
    }

    // code = 
    //   "§CODE_START" { (code_prop | code_hint | assign | prog) "\n" } "§CODE_END";
    parseCode() {
        this.p.terminal('§CODE_START');
        while(!this.p.is('§CODE_END') && !this.p.is('§END')) {
            if(this.p.is("input")) {
                this.parseCodeProp();
                this.p.terminal('§EOL');
            }
            else if(this.p.is('?')) {
                this.parseCodeHint();
                this.p.terminal('§EOL');
            }
            else if(this.p.is('JavaBlock') || this.p.is('JavaMethod') 
                    || this.p.is('Python')) {
                this.p.progParser.parseProg();
            }
            else {
                this.parseAssign();
                this.p.terminal('§EOL');
            }
        }
        if(!this.p.is("§END"))
            this.p.terminal('§CODE_END');
    }

    // code_prop = 
    //   "input" ("rows"|"cols") ":=" ("resizeable"|"static");
    parseCodeProp() {
        if(this.p.is("input"))
            this.p.next();
        else
            this.p.err("expected input");
        let isRows = false;
        if(this.p.is("rows")) {
            this.p.next();
            isRows = true;
        } else if(this.p.is("cols")) {
            this.p.next();
            isRows = false;
        } else
            this.p.err("expected 'rows' or 'cols'");
        this.p.terminal(":=");
        let isResizable = true;
        if(this.p.is("resizable")) {
            this.p.next();
            isResizable = true;
        } else if(this.p.is("static")) {
            this.p.next();
            isResizable = false;
        } else
            this.p.err("expected 'resizable' or 'static'");
        if(isRows)
            this.p.resizableRows = isResizable;
        else
            this.p.resizableCols = isResizable;
    }

    // code_hint = 
    //   "?" text;
    parseCodeHint() {
        if(this.p.is("?"))
            this.p.next();
        else
            this.p.err("expected ?");
        let hintSym = this.p.q.lastParsedInputSymbol;
        if(hintSym == null)
            this.p.err("Hint/explanation is forbidden, since there is no preceding input field");
        let htmlLen = this.p.q.html.length;
        this.p.textParser.parseText(true/*parsingHint=true*/);
        hintSym.hint_html = this.p.q.html.substr(htmlLen);
        this.p.q.html = this.p.q.html.substr(0, htmlLen);
    }

    chooseFromSet(set) {
        let v;
        if (set.length == 4 && set[2].type === symtype.T_DOTS) {
            let lowerBound = set[0].value;
            let upperBound = set[3].value;
            let step = parseFloat(set[1].value) - lowerBound;
            v = Math.floor(Math.random() * (upperBound - lowerBound + step) / step) * step + lowerBound;
        } else {
            let idx = Math.floor(Math.random() * set.length);
            v = set[idx].value;
        }
        return v;
    }

    // assign = 
    //     ID {"," ID} (":="|"=") expr
    //   | ID {"," ID} "in" (matrix_def | set | expr)
    //   | ID "[" expr "," expr "]" (":="|"=") expr
    //   | ID "[" expr "," expr "]" "in" (matrix_def | set | expr)
    //   | ID "(" ID {"," ID} ")" (":="|"=") symbolic_term;
    parseAssign() {
        this.p.q.stack = [];
        // set of left-hand side (lhs) variables
        let isFunction = false;
        let lhsIDs = [];
        let lhsSymbolIDs = []; // e.g. for "f(x,y)", we call "x" and "y" symbols
        let lhsMatrixIndexed = false;
        let lhsMatrixRow=0, lhsMatrixCol=0;
        this.p.ident();
        lhsIDs.push(this.p.id);
        if(this.p.id === 'i' || this.p.id === 'e') { // TODO: also test for functions names, ...
            this.p.err("id '" + this.p.id +"' is a reserved symbol");
        }
        if(this.p.is("(")) { // function / symbolic term
            isFunction = true;
            this.p.next();
            this.p.ident();
            lhsSymbolIDs.push(this.p.id);
            while(this.p.is(",")) {
                this.p.next();
                this.p.ident();
                lhsSymbolIDs.push(this.p.id);
            }
            this.p.terminal(")");
        } else if(this.p.is("[")) { // matrix indexing
            this.p.next();
            lhsMatrixIndexed = true;
            // row
            this.parseExpr();
            let tos = this.p.q.stack.pop(); // tos := top of stack
            if(tos.type != symtype.T_REAL || !Lexer.isInteger(tos.value))
                this.p.err("row index is not an integer value");
            lhsMatrixRow = tos.value;
            // separator
            this.p.terminal(",");
            // columns
            this.parseExpr();
            tos = this.p.q.stack.pop(); // tos := top of stack
            if(tos.type != symtype.T_REAL || !Lexer.isInteger(tos.value))
                this.p.err("column index is not an integer value");
            lhsMatrixCol = tos.value;
            // end
            this.p.terminal("]");
        } else { // list of lhs-variables only allowed for non-functions
            while(this.p.is(",")) {
                this.p.next();
                this.p.ident();
                lhsIDs.push(this.p.id);
            }
        }
        // assignment
        if(this.p.is(':=') || this.p.is('=')) {
            this.p.next();
            if(isFunction)
                this.p.codeSymParser.parseSymbolicTerm(lhsSymbolIDs);
            else
                this.parseExpr();
            let rhs = this.p.q.stack.pop();
            if(lhsMatrixIndexed) {
                if(rhs.type != symtype.T_REAL)
                    this.p.err("right-hand side must be of type real");
                if(!(lhsIDs[0] in this.p.q.symbols))
                    this.p.err("unkown symbol '" + lhsIDs[0] + "'");
                let lhs = this.p.q.symbols[lhsIDs[0]];
                if(lhs.type != symtype.T_MATRIX)
                    this.p.err("symbol '" + lhsIDs[0] + "' is not a matrix");
                lhs.value = LinAlg.SellLinAlg.mat_set_element(
                    lhs.value, lhsMatrixRow-1, lhsMatrixCol-1, rhs.value);
                if(lhs.value == null)
                    this.p.err("invalid indices");
            } else {
                for(let i=0; i<lhsIDs.length; i++)
                    this.p.q.symbols[lhsIDs[i]] = rhs;
            }
        }
        // choose element of right-hand side (rhs)
        else if(this.p.is('in')) {
            if(isFunction)
                this.p.err("cannot apply 'in' to a function")
            this.p.next();
            if(this.p.is('MM')) { // matrix
                this.parseMatrixDef();
                let rhs = this.p.q.stack.pop(); // rhs is a matrix definition
                let m = rhs.value[0];
                let n = rhs.value[1];
                let set = rhs.value[2];
                let invertible = rhs.value[3];
                let symmetric = rhs.value[4];
                for(let k=0; k<lhsIDs.length; k++) {
                    let value = math.zeros(m, n);
                    let iterations=0;
                    do { // run, until all properties are fulfilled
                        for(let i=0; i<m; i++) {
                            for(let j=0; j<n; j++) {
                                let element = this.chooseFromSet(set.value);
                                (value as math.Matrix).subset(math.index(i, j), element);
                            }
                        }
                        if(symmetric) {
                            for (let i=1; i<m; i++) {
                                for (let j=0; j<i; j++) {
                                    let element = (value as math.Matrix).subset(math.index(i, j));
                                    value = (value as math.Matrix).subset(math.index(j, i), element);
                                }
                            }
                        }
                        if(!invertible)
                            break;
                        if(iterations > 256)
                            this.p.err("matrix generation failed: too many iterations");
                        iterations ++;
                    } while(math.abs(math.det(value)) < 1e-16); // TODO:epsilon
                    this.p.q.symbols[lhsIDs[k]] = new SellSymbol(symtype.T_MATRIX, value);
                }
            } else if(this.p.is('{') || this.p.isIdent()) { // set
                if(this.p.is('{')) // TODO: move this to parseUnary!
                    this.parseSet();
                else
                    this.parseExpr();
                let rhs = this.p.q.stack.pop();
                if(rhs.type != symtype.T_SET)
                    this.p.err("expected a set");
                // run until (optional) constrains are met
                let lex_backup = this.p.backupLexer();
                let ctr = 0;
                while(true) {
                    if(ctr > 1000)
                        this.p.err("constraints for random variables cannot be fulfilled");
                    ctr ++;
                    for(let i=0; i<lhsIDs.length; i++) {
                        let value = this.chooseFromSet(rhs.value);
                        this.p.q.symbols[lhsIDs[i]] = new SellSymbol(symtype.T_REAL, value);
                    }
                    // optional constraint(s)
                    this.p.replayLexer(lex_backup);
                    if(this.p.is('with')) {
                        this.p.next();
                        this.parseExpr();
                        let tos = this.p.q.stack.pop(); // tos := top of stack
                        if(tos.type != symtype.T_BOOL)
                            this.p.err("constraint must be boolean");
                        if(tos.value)
                            break;
                    }
                    else
                        break; // if no constraints are set: stop
                }
            } else
                this.p.err("unexpected '" + this.p.tk + "'");
        }
        else
            this.p.err("expected ':=' or '=' or 'in'");
    }

    // expr =
    //   or;
    parseExpr() {
        this.parseOr();
    }

    // or =
    //   and [ "or" and ];
    parseOr() {
        this.parseAnd();
        if(this.p.is('or')) {
            let op = this.p.tk;
            this.p.next();
            this.parseAnd();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_BOOL && o2.type == symtype.T_BOOL) {
                this.p.pushSym(symtype.T_BOOL, o1.value || o2.value);
            } else
                this.p.err("types not compatible for '" + op + "' (must be boolean)");
        }
    }

    // and =
    //   equal [ "and" equal ];
    parseAnd() {
        this.parseEqual();
        if(this.p.is('and')) {
            let op = this.p.tk;
            this.p.next();
            this.parseEqual();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_BOOL && o2.type == symtype.T_BOOL) {
                this.p.pushSym(symtype.T_BOOL, o1.value && o2.value);
            } else
                this.p.err("types not compatible for '" + op + "' (must be boolean)");
        }
    }

    // equal =
    //   compare [ ("=="|"!=") compare ];
    parseEqual() {
        this.parseCompare();
        if(this.p.is('==') || this.p.is('!=')) {
            let op = this.p.tk;
            this.p.next();
            this.parseCompare();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                let isEqual = math.abs(o1.value-o2.value) < 1e-14;
                switch(op) {
                    case '==': this.p.pushSym(symtype.T_BOOL, isEqual); break;
                    case '!=': this.p.pushSym(symtype.T_BOOL, !isEqual); break;
                }
            } else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                let isEqual = LinAlg.SellLinAlg.mat_compare_numerically(o1.value, o2.value);
                switch(op) {
                    case '==': this.p.pushSym(symtype.T_BOOL, isEqual); break;
                    case '!=': this.p.pushSym(symtype.T_BOOL, !isEqual); break;
                }
            } else
                this.p.err("types not compatible for '" + op + "'");
        }
    }

    // compare =
    //   add [ ("<="|"<"|">="|">") add ];
    parseCompare() {
        this.parseAdd();
        if(this.p.is('<=') || this.p.is('<') || this.p.is('>=') || this.p.is('>')) {
            let op = this.p.tk;
            this.p.next();
            this.parseAdd();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '<=': this.p.pushSym(symtype.T_BOOL, o1.value <= o2.value); break;
                    case '<':  this.p.pushSym(symtype.T_BOOL, o1.value < o2.value); break;
                    case '>=': this.p.pushSym(symtype.T_BOOL, o1.value >= o2.value); break;
                    case '>':  this.p.pushSym(symtype.T_BOOL, o1.value > o2.value); break;
                }
            } else
                this.p.err("types not compatible for '" + op + "'");
        }
    }

    // add =
    //   mul { ("+"|"-") mul };
    parseAdd() {
        this.parseMul();
        while(this.p.is('+') || this.p.is('-')) {
            let op = this.p.tk;
            this.p.next();
            this.parseMul();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '+': this.p.pushSym(symtype.T_REAL, o1.value + o2.value); break;
                    case '-': this.p.pushSym(symtype.T_REAL, o1.value - o2.value); break;
                }
            } 
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '+': this.p.pushSym(symtype.T_COMPLEX, math.add(o1.value, o2.value)); break;
                    case '-': this.p.pushSym(symtype.T_COMPLEX, math.subtract(o1.value, o2.value)); break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                let o1_m = o1.value.size()[0]; let o1_n = o1.value.size()[1];
                let o2_m = o2.value.size()[0]; let o2_n = o2.value.size()[1];
                if(o1_m != o2_m || o1_n != o2_n)
                    this.p.err("cannot apply '" + op + "' on (" + o1_m + "x" + o1_n + ") and (" + o2_m + "x" + o2_n + ") matrices");
                this.p.pushSym(symtype.T_MATRIX, op=="+" ? math.add(o1.value, o2.value) : math.subtract(o1.value, o2.value));
            }
            else
                this.p.err("types not compatible for '" + op + "'");
        }
    }

    // mul =
    //   pow { ("*"|"/"|"mod") pow };
    parseMul() {
        this.parsePow();
        while(this.p.is('*') || this.p.is('/') || this.p.is('mod')) {
            let op = this.p.tk;
            this.p.next();
            this.parsePow();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '*': this.p.pushSym(symtype.T_REAL, o1.value * o2.value); break;
                    case '/': this.p.pushSym(symtype.T_REAL, o1.value / o2.value); break;
                    case 'mod':
                        if(!this.p.isNumberInt(o1.value) || !this.p.isNumberInt(o2.value))
                            this.p.err("operator 'mod' expectes integral operands");
                        this.p.pushSym(symtype.T_REAL, math.mod(math.round(o1.value), math.round(o2.value)));
                        break;
                }
            }
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '*': this.p.pushSym(symtype.T_COMPLEX, math.multiply(o1.value, o2.value)); break;
                    case '/': this.p.pushSym(symtype.T_COMPLEX, math.divide(o1.value, o2.value)); break;
                    case 'mod':
                        this.p.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                switch(op) {
                    case '*':
                        let o1_m = o1.value.size()[0]; let o1_n = o1.value.size()[1];
                        let o2_m = o2.value.size()[0]; let o2_n = o2.value.size()[1];
                        if(o1_n != o2_m)
                            this.p.err("cannot multiply (" + o1_m + "x" + o1_n + ") and (" + o2_m + "x" + o2_n + ") matrices");
                        this.p.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    case '/':
                    case 'mod':
                        this.p.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '*':
                        this.p.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    case 'mod':
                        // TODO: must test, if all elements of matrix are integral!
                        if(!this.p.isNumberInt(o2.value))
                            this.p.err("operator 'mod' expectes integral operands");
                        this.p.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_mod(o1.value, o2.value));
                        break;
                    default:
                        console.log(o1.value.toString())
                        this.p.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_REAL && o2.type == symtype.T_MATRIX) {
                switch(op) {
                    case '*':
                        this.p.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    default:
                        this.p.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else
                this.p.err("types not compatible for '" + op + "'");
        }
    }

    // pow =
    //   unary { ("^") unary };
    parsePow() {
        this.parseUnary();
        while(this.p.is('^')) {
            let op = this.p.tk;
            this.p.next();
            this.parseUnary();
            let o2 = this.p.q.stack.pop();
            let o1 = this.p.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '^': this.p.pushSym(symtype.T_REAL, math.pow(o1.value, o2.value)); break;
                }
            }
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '^': this.p.pushSym(symtype.T_COMPLEX, math.pow(o1.value, o2.value)); break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX_TRANSPOSE) {
                switch(op) {
                    case '^': this.p.pushSym(symtype.T_MATRIX, math.transpose(o1.value)); break;
                }
            }
            else
                this.p.err("types not compatible for '" + op + "'");
        }
    }

    // unary = (
    //   | "-" unary;
    //   | INT [ "." INT ]
    //   | "true" | "false"
    //   | "not" unary
    //   | "i" | "j" | "T"
    //   | function_call
    //   | ID [ "(" add { "," add } ")" ]
    //   | "..."
    //   | matrix
    //   | "(" expr ")"
    // ) [ factorial ];
    parseUnary() {
        if(this.p.is('-')) {
            this.p.next();
            this.parseUnary();
            let o = this.p.q.stack.pop();
            if(o.type == symtype.T_REAL)
                this.p.pushSym(symtype.T_REAL, - o.value);
            else
                this.p.err("unary '-' must be followed by type real");
        } else if(this.p.isInt()) {
            let value = parseInt(this.p.tk);
            this.p.next();
            if(this.p.is('.')) {
                this.p.next();
                if(!Lexer.isInteger(this.p.tk))
                    this.p.err("expected decimal places after '.'");
                value = parseFloat(""+value+"."+this.p.tk);
                this.p.next();
            }
            this.p.q.stack.push(new SellSymbol(symtype.T_REAL, value));
        } else if(this.p.is("true")) {
            this.p.next();
            this.p.q.stack.push(new SellSymbol(symtype.T_BOOL, true));
        } else if(this.p.is("false")) {
            this.p.next();
            this.p.q.stack.push(new SellSymbol(symtype.T_BOOL, false));
        } else if(this.p.is("not")) {
            this.p.next();
            this.parseUnary();
            let u = this.p.q.stack.pop();
            if(u.type != symtype.T_BOOL)
                this.p.err("expected boolean datatype as argument for 'not'");
            this.p.q.stack.push(new SellSymbol(symtype.T_BOOL, !u.value));
        } else if(this.p.is("i") || this.p.is("j")) {
            this.p.q.stack.push(new SellSymbol(symtype.T_COMPLEX, math.complex(0,1)));
            this.p.next();
        } else if(this.p.is("T")) {
            this.p.q.stack.push(new SellSymbol(symtype.T_MATRIX_TRANSPOSE, "T"));
            this.p.next();
        } else if(this.getFunctionList().includes(this.p.tk)) {
            this.parseFunctionCall();
        } else if(this.p.isIdent()) {
            let id = this.p.tk;
            this.p.next();
            if((id in this.p.q.symbols) == false)
                this.p.err("unknown identifier '" + id + "'");
            let sym = this.p.q.symbols[id];
            if(sym.type == symtype.T_FUNCTION && this.p.is("(")) {
                this.p.next();
                this.parseAdd();
                let args = [ this.p.q.stack.pop() ];
                while(this.p.is(",")) {
                    this.p.next();
                    this.parseAdd();
                    args.push(this.p.q.stack.pop());
                }
                let term : SellSymTerm = sym.value;
                let termSymIDs = term.symbolIDs;
                if(termSymIDs.length != args.length)
                    this.p.err("number of arguments does not correspond to function definition")
                let args_dict = {};
                for(let i=0; i<termSymIDs.length; i++) {
                    if(args[i].type != symtype.T_REAL)
                        this.p.err("all arguements must be scalar and real valued");
                    args_dict[termSymIDs[i]] = args[i].value;
                }
                let v = term.eval(args_dict);
                let v_sym = new SellSymbol(symtype.T_REAL, v);
                this.p.q.stack.push(v_sym);
                this.p.terminal(')');
            } else
                this.p.q.stack.push(sym);
        } else if(this.p.is("...")) {
            this.p.next();
            this.p.q.stack.push(new SellSymbol(symtype.T_DOTS));
        } else if(this.p.is("{")) {
            this.parseSet();
        } else if(this.p.is("[")) {
            this.parseMatrix();
        } else if(this.p.is("(")) {
            this.p.next();
            this.parseExpr();
            this.p.terminal(")");
        } else
            this.p.err("expected unary, got '" + this.p.tk + "'");
        // postfix
        if(this.p.is('!'))
            this.parseFactorial();
    }

    // matrix =
    //   "[" "[" expr {"," expr} "]" { "," "[" expr {"," expr} "]" } "]";
    parseMatrix() {
        this.p.terminal('[');
        let cols = -1;
        let rows = 0;
        let elements = [];
        let elementsType = null;
        while(this.p.is('[') || this.p.is(',')) {
            if(rows > 0)
                this.p.terminal(',');
            this.p.terminal('[');
            let col = 0;
            while(!this.p.is(']') && !this.p.is('§EOF')) {
                if(col > 0)
                    this.p.terminal(',');
                this.parseExpr();
                let element = this.p.q.stack.pop();
                if(element.type != symtype.T_REAL && element.type != symtype.T_FUNCTION)
                    this.p.err("matrix element must be of type real or function");
                if(elementsType == null)
                elementsType = element.type;
                else if(element.type != elementsType)
                    this.p.err("all matrix elements must have same type");
                elements.push(element.value);
                col ++;
            }
            if(cols == -1)
                cols = col;
            else if(col != cols)
                this.p.err('matrix has different number of cols per row');
            this.p.terminal(']');
            rows ++;
        }
        if(rows < 1 || cols < 1)
            this.p.err('matrix must have at least one row and one column');
        this.p.terminal(']');
        // create matrix:
        let matrix = null;
        let matrixType = elementsType == symtype.T_REAL ? 
            symtype.T_MATRIX : symtype.T_MATRIX_OF_FUNCTIONS;
        if(matrixType == symtype.T_MATRIX) {
            matrix = math.zeros(rows, cols);
            sellassert(elements.length == rows*cols);
            for(let i=0; i<rows; i++)
                for(let j=0; j<cols; j++)
                    matrix = LinAlg.SellLinAlg.mat_set_element(matrix, i, j, elements[i*cols+j]);
        } else { // matrixType == symtype.T_MATRIX_OF_FUNCTIONS
            matrix = new SellSymTerm_Matrix(rows, cols, elements);
        }
        this.p.q.stack.push(
            new SellSymbol(matrixType, matrix));
    }

    // function_call = 
    //   ("abs"|"binomial"|"integrate"|"conj"|"sqrt"|"xgcd"|"det"|"rank"|"inv"
    //      |"eye"|"eigenvalues_sym"|"triu"|"sin"|"cos"|"asin"|"acos"|"tan"
    //      |"atan"|"norm2"|"dot"|"cross"|"linsolve"| "is_zero")
    //   ID "(" [ expr {"," expr} ] ")";
    parseFunctionCall() {
        this.p.ident();
        let functionName = this.p.id;
        this.p.terminal('(');
        // get parameters =: p
        let p = [];
        while(!this.p.is(')') && !this.p.is('§EOL') && !this.p.is('§EOF')) {
            if(p.length > 0)
                this.p.terminal(',');
            if(functionName == "integrate" && p.length==1) {
                // second parametr of "integrate" must be a string
                this.p.ident();
                p.push(this.p.id);
            } else {
                this.parseExpr();
                p.push(this.p.q.stack.pop());
            }
        }
        this.p.terminal(')');
        // calculate
        if(functionName === 'abs') {
            if(p.length != 1 || (p[0].type != symtype.T_REAL && p[0].type != symtype.T_COMPLEX))
                this.p.err("signature must be 'abs(real|complex)'");
            this.p.pushSym(symtype.T_REAL, math.abs(p[0].value));
        } else if(functionName === 'sqrt') {
            if(p.length != 1 || (p[0].type != symtype.T_REAL && p[0].type != symtype.T_COMPLEX))
                this.p.err("signature must be 'sqrt(real|complex)'");
            let v = math.sqrt(p[0].value);
            let isComplex = math.typeOf(v) == 'Complex';
            this.p.pushSym(isComplex ? symtype.T_COMPLEX : symtype.T_REAL, v);

        } else if(['sin','asin','cos','acos','tan','atan'].includes(functionName)) {
            if(p.length != 1 || p[0].type != symtype.T_REAL)
                this.p.err("signature must be '" + functionName + "(real)'");
            let v=0.0;
            switch(functionName) {
                case 'sin': v = math.sin(p[0].value); break;
                case 'asin': v = math.asin(p[0].value); break;
                case 'cos': v = math.cos(p[0].value); break;
                case 'acos': v = math.acos(p[0].value); break;
                case 'tan': v = math.tan(p[0].value); break;
                case 'atan': v = math.atan(p[0].value); break;
                default: this.p.err("UNIMPLEMENTED: " + functionName)
            }
            this.p.pushSym(symtype.T_REAL, v);
        } else if(functionName === 'conj') {
            if(p.length != 1 || p[0].type != symtype.T_COMPLEX)
                this.p.err("signature must be 'conj(complex)'");
                this.p.pushSym(symtype.T_COMPLEX, math.conj(p[0].value));
        } else if(functionName === 'binomial') {
            if(p.length != 2 || p[0].type != symtype.T_REAL || p[1].type != symtype.T_REAL
                || !this.p.isNumberInt(p[0].value) || !this.p.isNumberInt(p[1].value))
                this.p.err("signature must be 'binomial(int,int)'");
            this.p.pushSym(symtype.T_REAL, math.combinations(math.round(p[0].value), math.round(p[1].value)));
        } else if(functionName === 'xgcd') {
            if(p.length != 3 || p[0].type != symtype.T_REAL || p[1].type != symtype.T_REAL
                || p[2].type != symtype.T_REAL
                || !this.p.isNumberInt(p[0].value) || !this.p.isNumberInt(p[1].value)
                || !this.p.isNumberInt(p[2].value))
                this.p.err("signature must be 'xgcd(int,int,int)'");
                this.p.pushSym(symtype.T_REAL, math.subset(math.xgcd(p[0].value, p[1].value), 
                    math.index(p[2].value - 1)));
        }
        else if(functionName === 'integrate') {
            if(p.length != 4 || p[0].type != symtype.T_FUNCTION || typeof(p[1]) !== 'string'
                || p[2].type != symtype.T_REAL || p[3].type != symtype.T_REAL )
                this.p.err("signature must be 'integrate(function, string, real, real)'");
            let v = p[0].value.integrateNumerically(p[1], p[2].value, p[3].value);
            let precision = 0.001;
            this.p.pushSym(symtype.T_REAL, v, precision);
        }
        else if(['det','rank','inv','eigenvalues_sym','triu','norm2'].includes(functionName)) {
            if(p.length != 1 || p[0].type != symtype.T_MATRIX)
                this.p.err("signature must be '" + functionName + "(matrix)'");
            if(functionName === 'det')
                this.p.pushSym(symtype.T_REAL, math.det(p[0].value));
            else if(functionName === 'rank')
                this.p.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_rank(p[0].value));
            else if(functionName === 'inv')
                this.p.pushSym(symtype.T_MATRIX, math.inv(p[0].value));
            else if(functionName === 'eigenvalues_sym') {
                if(!LinAlg.SellLinAlg.mat_is_symmetric(p[0].value))
                    this.p.err("matrix is not symmetric");
                let eigs = (math.eigs(p[0].value).values as any)._data;
                let set = [];
                for(let i=0; i<eigs.length; i++)
                    set.push(new SellSymbol(symtype.T_REAL, eigs[i]));
                this.p.pushSym(symtype.T_SET, set);
            } else if(functionName === 'triu') {
                this.p.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_triu(p[0].value));
            } else if(functionName === 'norm2') {
                this.p.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_norm2(p[0].value));
            } else
                sellassert(false);
        }
        else if(functionName === 'eye') {
            if(p.length != 1 || p[0].type != symtype.T_REAL || !this.p.isNumberInt(p[0].value))
                this.p.err("signature must be 'eye(integer)'");
            this.p.pushSym(symtype.T_MATRIX, math.identity(math.round(p[0].value)));
        }
        else if(functionName === 'dot') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.p.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != 1)
                this.p.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.p.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[1].value))
                this.p.err("vectors in 'dot(..)' must have equal length");
            this.p.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_vecdot(p[0].value, p[1].value));
        }
        else if(functionName === 'cross') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.p.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != 1)
                this.p.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.p.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != 3)
                this.p.err("vectors in 'cross(..)' must have length 3");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[1].value) != 3)
                this.p.err("vectors in 'cross(..)' must have length 3");
            this.p.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_veccross(p[0].value, p[1].value));
        }
        else if(functionName === 'linsolve') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.p.err("signature must be 'linsolve(matrix,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[0].value))
                this.p.err("matrix must be square, i.e. m=n");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.p.err("second parameter must be a colum vector");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[1].value))
                this.p.err("number of rows of matrix and does not match vector");
            this.p.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.linsolve(p[0].value, p[1].value));
        }
        else if(functionName === 'is_zero') {
            if(p.length != 1 || p[0].type != symtype.T_MATRIX)
                this.p.err("signature must be 'is_zero(matrix)'");
            this.p.pushSym(symtype.T_BOOL, LinAlg.SellLinAlg.mat_is_zero(p[0].value));
        }
        else if(functionName === 'min') {
            if(p.length != 1 || p[0].type != symtype.T_SET)
                this.p.err("signature must be 'min(set)'");
            let v = 1e13;
            for(let i=0; i<p[0].value.length; i++) {
                if(p[0].value[i].value < v)
                    v = p[0].value[i].value;
            }
            this.p.pushSym(symtype.T_REAL, v);
        }
        else if(functionName === 'max') {
            if(p.length != 1 || p[0].type != symtype.T_SET)
                this.p.err("signature must be 'max(set)'");
            let v = -1e13;
            for(let i=0; i<p[0].value.length; i++) {
                if(p[0].value[i].value > v)
                    v = p[0].value[i].value;
            }
            this.p.pushSym(symtype.T_REAL, v);
        }
        else
            this.p.err("unimplemented function call '" + functionName + "'");
    }

    // factorial =
    //   "!";
    parseFactorial() {
        this.p.terminal('!');
        let op = '!';
        let o = this.p.q.stack.pop();
        if(o.type == symtype.T_REAL)
            this.p.pushSym(symtype.T_REAL, math.factorial(o.value));
        else
            this.p.err("types not compatible for '" + op + "'");
    }

    // matrix_def = 
    //   "MM" "(" expr "x" expr "|" expr [ {"," ("invertible"|"symmetric")} ] ")";
    parseMatrixDef() {
        this.p.terminal("MM");
        this.p.terminal("(");
        // number of rows
        this.parseExpr();
        let m = this.p.q.stack.pop();
        if(m.type !== symtype.T_REAL || !this.p.isNumberInt(m.value))
            this.p.err("expected integer for the number of rows");
        let rows = math.round(m.value);
        if(rows <= 0)
            this.p.err("number of matrix cols must be > 0 (actually is '" + rows + "')")
        // times
        this.p.terminal("x");
        // number of columns
        this.parseExpr();
        let n = this.p.q.stack.pop();
        if(n.type !== symtype.T_REAL || !this.p.isNumberInt(n.value))
            this.p.err("expected integer for the number of columns");
        let cols = math.round(n.value);
        if(cols <= 0)
            this.p.err("number of matrix rows must be > 0 (actually is '" + cols + "')")
        // set
        this.p.terminal("|");
        this.parseExpr();
        let set = this.p.q.stack.pop();
        if(set.type !== symtype.T_SET)
            this.p.err("expected set from which matrix elements are drawn");
        // properties
        let invertible = false;
        let symmetric = false;
        while(this.p.is(",")) {
            this.p.next();
            let prop = this.p.tk;
            switch(prop) {
                case 'invertible': invertible = true; break;
                case 'symmetric': symmetric = true; break;
                default:
                    this.p.err("unknown property '" + prop +"'");
            }
            this.p.next();
        }
        // end
        this.p.terminal(")");
        // create symbol
        this.p.pushSym(symtype.T_MATRIX_DEF, [rows, cols, set, invertible, symmetric]);
    }

    // set = 
    //   "{" [ expr { "," expr } ] "}";
    parseSet() {
        this.p.terminal("{");
        let idx = 0;
        let sym = new SellSymbol(symtype.T_SET);
        sym.value = [];
        let hasDot = false;
        while(!this.p.is('}') && !this.p.is('§EOF')) {
            if(idx > 0)
                this.p.terminal(",");
            this.parseExpr();
            let symi = this.p.q.stack.pop();
            sym.value.push(symi);
            if(symi.type !== symtype.T_REAL) {
                if(idx==2 && symi.type === symtype.T_DOTS)
                    hasDot = true;
                else if(symi.type === symtype.T_COMPLEX)
                    sym.type = symtype.T_COMPLEX_SET;
                else 
                    this.p.err("set must consist of real values only");
            }
            idx ++;
        }
        if(hasDot && idx != 4 || hasDot && sym.type == symtype.T_COMPLEX_SET)
            this.p.err("if set contains '...', then it must have 4 real-valued elements")
        if(sym.type == symtype.T_COMPLEX_SET) {
            for(let i=0; i<sym.value.length; i++) {
                if(sym.value[i].type == symtype.T_REAL)
                    sym.value[i].value = math.complex(sym.value[i].value, 0);
            }
        }
        this.p.q.stack.push(sym);
        this.p.terminal("}");
    }
    
}
