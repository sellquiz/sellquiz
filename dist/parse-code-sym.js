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
import { symtype, SellSymbol } from './symbol.js';
import * as Symbolic from './symbolic.js';
export class ParseCodeSym {
    constructor(parent) {
        this.p = parent;
    }
    // symbolic_term = 
    //   symbolic_term_add;
    parseSymbolicTerm(lhsSymbolIDs) {
        let symterm = new Symbolic.SellSymTerm(lhsSymbolIDs);
        this.parseSymbolicTerm_Add(symterm);
        symterm.optimize();
        this.p.q.stack.push(new SellSymbol(symtype.T_FUNCTION, symterm));
    }
    // symbolic_term_expr = 
    //   symbolic_term_add;
    parseSymbolicTerm_Expr(symterm) {
        this.parseSymbolicTerm_Add(symterm);
    }
    // symbolic_term_add = 
    //   symbolic_term_mul { ("+"|"-") symbolic_term_mul };
    parseSymbolicTerm_Add(symterm) {
        this.parseSymbolicTerm_Mul(symterm);
        while (this.p.is("+") || this.p.is("-")) {
            let op = this.p.tk;
            this.p.next();
            this.parseSymbolicTerm_Mul(symterm);
            symterm.pushBinaryOperation(op);
        }
    }
    // symbolic_term_mul = 
    //   symbolic_term_pow { ("*"|"/") symbolic_term_pow };
    parseSymbolicTerm_Mul(symterm) {
        this.parseSymbolicTerm_Pow(symterm);
        while (this.p.is("*") || this.p.is("/")) {
            let op = this.p.tk;
            this.p.next();
            this.parseSymbolicTerm_Pow(symterm);
            symterm.pushBinaryOperation(op);
        }
    }
    // symbolic_term_pow = 
    //   symbolic_term_unary { "^" symbolic_term_unary };
    parseSymbolicTerm_Pow(symterm) {
        this.parseSymbolicTerm_Unary(symterm);
        while (this.p.is("^")) {
            let op = this.p.tk;
            this.p.next();
            this.parseSymbolicTerm_Unary(symterm);
            symterm.pushBinaryOperation(op);
        }
    }
    // symbolic_term_unary = 
    //     "(" symbolic_term_expr ")" 
    //   | INT ["!"] 
    //   | FLOAT
    //   | ("exp"|"sin"|"cos"|"sqrt") "(" symbolic_term_expr ")"
    //   | "diff" "(" symbolic_term_expr "," ID  ")"
    //   | ID 
    //   | ID "(" [ expr { "," epxr } ] ")"
    //   | "-" symbolic_term_pow;
    parseSymbolicTerm_Unary(symterm) {
        if (this.p.is("(")) {
            this.p.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            this.p.terminal(")");
        }
        else if (this.p.isNumber()) {
            let value = parseFloat(this.p.tk);
            this.p.next();
            if (this.p.is("!")) {
                if (!this.p.isNumberInt(value))
                    this.p.err("expected integer for '!'");
                this.p.next();
                value = math.factorial(value);
            }
            symterm.pushConstant(value);
        }
        else if (["exp", "sin", "cos", "sqrt"].includes(this.p.tk)) {
            // functions with 1 parameter
            let fctId = this.p.tk;
            this.p.next();
            this.p.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            this.p.terminal(")");
            symterm.pushUnaryFunction(fctId);
        }
        else if (this.p.is("diff")) {
            this.p.next();
            this.p.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            //let diff_fct = symterm.stack[symterm.stack.length - 1];
            /*this.p.ident();
            let diff_fctId = this.p.id;
            if((diff_fctId in this.p.q.symbols) == false)
                this.p.err("unknown function '" + diff_fctId + "'");
            let diff_fct = this.p.q.symbols[diff_fctId];
            if(symterm.symbolIDs.length != diff_fct.value.symbolIDs.length)
                this.p.err("cannot apply diff(): set of variables does not correspond to left-hand side");
            for(let i=0; i<symterm.symbolIDs.length; i++) {
                if(symterm.symbolIDs[i] !== diff_fct.value.symbolIDs[i])
                    this.p.err("cannot apply diff(): set of variables does not correspond to left-hand side");
            }*/
            /*TODO: if(diff_fct.type !== symtype.T_FUNCTION)
                this.p.err("first parameter of 'diff' must be a function");*/
            this.p.terminal(",");
            this.p.ident();
            let diff_symId = this.p.id;
            this.p.terminal(")");
            symterm.pushVariable(diff_symId);
            /*TODO: if(!diff_fct.value.symbolIDs.includes(diff_symId))
                this.p.err("cannot apply diff(): '" + diff_symId + "' is not a variable of function '" + diff_fctId + "'");*/
            //let diff = diff_fct.value.derivate(diff_symId);
            //symterm.pushSymbolicTerm(diff);
            symterm.pushDiff();
        }
        else if (this.p.isIdent()) {
            let id = this.p.tk;
            this.p.next();
            if (id in this.p.q.symbols) {
                let symbol = this.p.q.symbols[id];
                if (symbol.type === symtype.T_REAL)
                    symterm.pushConstant(symbol.value);
                else if (symbol.type == symtype.T_FUNCTION) {
                    if (this.p.is("(")) {
                        let evalParameters = [];
                        this.p.terminal("(");
                        while (!this.p.is(")") && !this.p.is("§EOF")) {
                            if (evalParameters.length > 0)
                                this.p.terminal(",");
                            this.p.codeParser.parseExpr(); // must be an evaluted term, not a symbolic term!
                            let evalParameter = this.p.q.stack.pop();
                            if (evalParameter.type !== symtype.T_REAL)
                                this.p.err("paremeter must be of type 'real'");
                            evalParameters.push(evalParameter.value);
                        }
                        this.p.terminal(")");
                        if (symbol.value.symbolIDs.length != evalParameters.length)
                            this.p.err("number of parameters does not match definition of function '" + id + "'");
                        let varValues = {};
                        for (let i = 0; i < symbol.value.symbolIDs.length; i++)
                            varValues[symbol.value.symbolIDs[i]] = evalParameters[i];
                        symterm.pushConstant(symbol.value.eval(varValues));
                    }
                    else {
                        symterm.pushSymbolicTerm(symbol.value);
                    }
                }
                else
                    this.p.err("identifer '" + id + "' must be of type 'real'");
            }
            else
                symterm.pushVariable(id); // TODO: check, if it is in symbolIDs (member of SellSymbolicTerm) or a known function
        }
        else if (this.p.is("-")) {
            this.p.next();
            this.parseSymbolicTerm_Pow(symterm);
            symterm.pushUnaryOperation("-");
        }
        else
            this.p.err("expected unary");
    }
}
//# sourceMappingURL=parse-code-sym.js.map