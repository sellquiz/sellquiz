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

// im := inline math

import { symtype, SellSymbol } from './symbol.js';
import { SellMatrixInput } from './matinput.js';

export class ParseIM {

    constructor(parent) {
        this.p = parent;
    }

    // inline_math =
    //   "$" { im_expr } "$";
    parseInlineMath() {
        let html = '';
        this.p.terminal('$');
        html += ' \`';
        while(!this.p.is('$') && !this.p.is('§END'))
            html += this.parseIM_Expr();
        html += '\` ';
        this.p.terminal('$');
        this.p.q.html += ' <span style="font-size: 13pt;">' +  html.replaceAll('\`\`','') + '</span> ';
    }

    // im_expr =  /*similar to ASCII math*/
    //   im_list;
    parseIM_Expr() {
        return this.parseIM_List();
    }

    // im_list =
    //   im_assign { (","|":"|"->"|"|->") } im_assign;
    parseIM_List() {
        let html = this.parseIM_Assign();
        //    comma           colon           right arrow      maps to
        while(this.p.is(',') || this.p.is(':') || this.p.is('->') || this.p.is('|->')) {
            let op = this.p.tk; 
            this.p.next(); 
            html += ' ' + op + ' ' + this.parseIM_Assign();
        }
        return html;
    }

    // im_assign =
    //   im_other_binary_op "=" im_other_binary_op;
    parseIM_Assign() {
        let html = this.parseIM_OtherBinaryOp();
        while(this.p.is('=')) { 
            this.p.next(); 
            html = html + ' = ' + this.parseIM_OtherBinaryOp();
        }
        return html;
    }

    // im_other_binary_op =
    //   im_relational { ("in"|"notin"|"uu"|"^^"|"vv"|"@") } im_relational;
    parseIM_OtherBinaryOp() {
        let html = this.parseIM_Relational();
        //    element of       not element of      union            logical and      logical or       circ
        while(this.p.is('in') || this.p.is('notin') || this.p.is('uu') || this.p.is('^^') || this.p.is('vv') || this.p.is('@')) {
            let op = this.p.tk;
            this.p.next();
            html = html + ' ' + op + ' ' + this.parseIM_Relational();
        }
        return html;
    }

    // im_relational = 
    //   im_add { ("<"|"<="|">"|">="|"!=") im_add };
    parseIM_Relational() {
        let html = this.parseIM_Add();
        while(this.p.is('<') || this.p.is('<=') || this.p.is('>') || this.p.is('>=') || this.p.is('!=')) {
            let op = this.p.tk;
            this.p.next();
            html = html + ' ' + op + ' ' + this.parseIM_Add();
        }
        return html;
    }

    // im_add =
    //   im_mul { ("+"|"-") im_mul };
    parseIM_Add() {
        let html = this.parseIM_Mul();
        while(this.p.is('+') || this.p.is('-')) {
            let op = this.p.tk;
            this.p.next();
            html = html + ' ' + op + ' ' + this.parseIM_Mul();
        }
        return html;
    }

    // im_mul =
    //   im_pow { ("*"|"/") im_pow };
    parseIM_Mul() {
        let html = this.parseIM_Pow();
        while(this.p.is('*') || this.p.is('/')) {
            let op = this.p.tk;
            this.p.next();
            html = html + ' ' + op + ' ' + this.parseIM_Pow();
        }
        return html;
    }

    // im_pow =
    //   im_unary { "^" im_unary };
    parseIM_Pow() {
        let html = this.parseIM_Unary();
        while(this.p.is('^')) {
            let op = this.p.tk;
            this.p.next();
            html = html + ' ' + op + ' ' + this.parseIM_Unary();
        }
        return html;
    }

    // im_unary = (
    //     im_input
    //   | "text" "(" { MISC } ")"
    //   | "augmented" "(" ID "|" ID ")"
    //   | ("sum"|"prod"|"lim"|"int") [ "_" expr ] [ "^" expr ]
    //   | "RR" | "ZZ" | "QQ" | "CC"
    //   | "oo" | "infty"
    //   | "equiv" | "mod"
    //   | "EE" | "AA"
    //   | "dx" | "dy" | "dz"
    //   | "bar" im_unary
    //   | "-" unary
    //   | " "
    //   | INT | FLOAT
    //   | ID
    //   | ID "[" (INT|":") "," (INT|":") "]"
    //   | "\"" ID "\""
    //   | "(" im_expr ")"
    //   | "{" { im_expr } "}"
    //   | "|"
    //   | "\"
    //   | "\\"
    //   | "..."
    //   | im_matrix
    // ) [ "!" | {"'"} ];
    parseIM_Unary() {
        let html = '';
        if(this.p.is('#'))
            html += '\`' + this.parseIM_Input() + '\`'; // '\`' ends and restarts math-jax env
        else if(this.p.is('text')) {
            this.p.next();
            this.p.terminal('(');
            html += ' \` ';
            while(!this.p.is(")") && !this.p.is("§EOF")) {
                html += this.p.tk;
                this.p.next();
            }
            html += ' \` ';
            this.p.terminal(')');
        }
        else if(this.p.is('augmented')) {
            this.p.next();
            this.p.terminal('(');
            let A=null, b=null;
            if(this.p.isIdent()) { // TODO: does not allow variable names with '_' yet
                if((this.p.tk in this.p.q.symbols) && this.p.q.symbols[this.p.tk].type == symtype.T_MATRIX)
                    A = this.p.q.symbols[this.p.tk].value;
                else
                    this.p.err("expected a matrix");
                this.p.next();
            } else
                this.p.err("expected a matrix");
            this.p.terminal('|');
            if(this.p.isIdent()) { // TODO: does not allow variable names with '_' yet
                if((this.p.tk in this.p.q.symbols) && this.p.q.symbols[this.p.tk].type == symtype.T_MATRIX)
                    b = this.p.q.symbols[this.p.tk].value;
                else
                    this.p.err("expected a column vector");
                this.p.next();
            } else
                this.p.err("expected a column vector");
            this.p.terminal(')');
            // construct augmented matrix in ASCIIMATH (e.g. "((a,b,|,c),(d,e,|,f))")
            let m = LinAlg.SellLinAlg.mat_get_row_count(A);
            let n = LinAlg.SellLinAlg.mat_get_col_count(A);
            if(LinAlg.SellLinAlg.mat_get_col_count(b) != 1)
                this.p.err("expected a column vector");
            if(LinAlg.SellLinAlg.mat_get_row_count(b) != n)
                this.p.err("matrix rows and vector rows not matching");
            let augm = '(';
            for(let i=0; i<m; i++) {
                augm += '(';
                for(let j=0; j<n; j++)
                    augm += LinAlg.SellLinAlg.mat_get_element_value(A, i, j) + ",";
                augm += '|,' + LinAlg.SellLinAlg.mat_get_element_value(b, i, 0);
                augm += ')';
                if(i < m-1)
                    augm += ',';
            }
            augm += ')';
            html += augm + ' '; // TODO: round parentheses vs brackets: must be configurable
        }
        else if(this.p.is('sum') || this.p.is('prod') || this.p.is('lim') || this.p.is('int')) {
            html += ' ' + this.p.tk;
            this.p.next();
            if(this.p.is('_')) {
                this.p.next();
                html += '_' + this.parseIM_Expr();
            }
            if(this.p.is('^')) {
                this.p.next();
                html += '^' + this.parseIM_Expr();
            }
            html += ' ';
        }
        else if(this.p.is('RR') || this.p.is('ZZ') || this.p.is('QQ') || this.p.is('CC')) {
            html += this.p.tk + " ";
            this.p.next();
        }
        else if(this.p.is('oo') || this.p.is('infty')) { // infinity
            html += this.p.tk + " ";
            this.p.next();
        }
        else if(this.p.is('equiv') || this.p.is('mod')) {
            html += this.p.tk + " ";
            this.p.next();
        }
        else if(this.p.is('EE') || this.p.is('AA')) {
            html += this.p.tk + " ";
            this.p.next();
            html += this.parseIM_Expr();
        }
        else if(this.p.is('dx') || this.p.is('dy') || this.p.is('dz')) {
            html += '\\ \\ ' + this.p.tk;
            this.p.next();
        }
        else if(this.p.is('bar')) {
            html += this.p.tk + " ";
            this.p.next();
            html += this.parseIM_Unary();
        }
        else if(this.p.is('-')) {
            this.p.next();
            html += '-';
            html += this.parseIM_Unary();
        }
        else if(this.p.is(' ')) {
            html += ' ';
            this.p.next();
        }
        else if(this.p.isNumber()) {
            html += this.p.tk;
            this.p.next();
        }
        else if(this.p.isIdent()) {
            let id = this.p.tk;
            this.p.next();
            while(this.p.tk == '_') {
                id += '_';
                this.p.next();
                if(this.p.isIdent() || this.p.isNumber()) {
                    id += this.p.tk;
                    this.p.next();
                }
            }
            if(id in this.p.q.symbols) {
                if(this.p.q.symbols[id].type == symtype.T_MATRIX && this.p.is("[")) { // submatrix
                    let i=0, j=0, allRows=false, allCols=false;
                    this.p.next();
                    // row
                    if(this.p.is(":")) {
                        this.p.next();
                        allRows = true;
                    }
                    else if(this.p.isInt()){
                        i = parseInt(this.p.tk);
                        this.p.next();
                    } else
                        this.p.err("expected integer for matrix row");
                    // separator
                    this.p.terminal(",");
                    // col
                    if(this.p.is(":")) {
                        this.p.next();
                        allCols = true;
                    }
                    else if(this.p.isInt()){
                        j = parseInt(this.p.tk);
                        this.p.next();
                    } else
                        this.p.err("expected integer for matrix col");
                    // end
                    this.p.terminal("]");
                    let symbol = this.p.q.symbols[id];
                    if(symbol.type != symtype.T_MATRIX)
                        this.p.err("'" + id + "' is not a matrix");
                    let first_row = allRows ? 0 : i-1;
                    let last_row = allRows ? -1 : i-1;
                    let first_col = allCols ? 0 : j-1;
                    let last_col = allCols ? -1 : j-1;
                    let submat = LinAlg.SellLinAlg.mat_submatrix(
                        symbol.value, first_row, last_row, first_col, last_col);
                    if(submat == null)
                        this.p.err("invalid indices");
                    html += submat.toString(); // TODO: toAsciiMath()! (requires symbol!)
                } else
                    html += this.p.q.symbols[id].toAsciiMath();
            }
            else
                html += id;
        }
        else if(this.p.is('"')) {
            this.p.next();
            this.p.ident();
            let id = this.p.id;
            while(this.p.tk == '_') {
                id += '_';
                this.p.next();
                if(this.p.isIdent() || this.p.isNumber()) {
                    id += this.p.tk;
                    this.p.next();
                }
            }
            html += id;
            this.p.terminal('"');
        }
        else if(this.p.is('(')) {
            this.p.next();
            html += '(';
            while(!this.p.is(')') && !this.p.is("§EOF"))
                html += this.parseIM_Expr();
            this.p.terminal(')');
            html += ')';
        }
        else if(this.p.is('{')) {
            this.p.next();
            html += '{ ';
            while(!this.p.is("}") && !this.p.is("§EOF"))
                html += this.parseIM_Expr();
            this.p.terminal('}');
            html += ' }';
        }
        else if(this.p.is('|')) {
            this.p.next();
            html += '|';
        }
        else if(this.p.is('\\')) { // spacing
            this.p.next();
            html += '\\ \\ ';
        }
        else if(this.p.is('\\\\') || this.p.is('setminus')) {
            this.p.next();
            html += 'setminus';
        }
        else if(this.p.is('...')) {
            this.p.next();
            html += '... ';
        }
        else if((this.p.is('[') && this.p.is2('[')) || (this.p.is('(') && this.p.is2('('))) {
            html += this.parseIM_Matrix();
        }
        else if(this.p.is('[') || this.p.is(']')) {
            html += this.p.tk;
            this.p.next();
            while(!this.p.is("]") && !this.p.is("[") && !this.p.is("§EOF"))
                html += this.parseIM_Expr();
            if(this.p.is('[') || this.p.is(']')) {
                html += this.p.tk;
                this.p.next();
            } else
                this.p.err("expected '[' or ']'");
        }
        else
            this.p.err("expected unary, got '" + this.p.tk + "'");
        // postfix
        if(this.p.is('!')) {
            this.p.next();
            html += '! ';
        }
        while(this.p.is("'")) {
            this.p.next();
            html += "'";
        }
        return html;
    }

    // im_matrix = 
    //     "["        "[" im_expr {"," im_expr} "]" 
    //          { "," "[" im_expr {"," im_expr} "]" } "]";
    //   | "("        "(" im_expr {"," im_expr} "]" 
    //          { "," "[" im_expr {"," im_expr} ")" } ")";
    parseIM_Matrix() {
        // expecting  first2(IM_matrix) == [ "[", "[" ]
        //         or first2(IM_matrix) == [ "(", "(" ].
        // otherwise, we assume a parenthesized expression.
        let html = '';
        let p_open = ''; // '[' or '('
        let p_close = ''; // ']' or ')'
        if(this.p.is('[') && this.p.is2('[')) {
            p_open = '[';
            p_close = ']';
            this.p.next();
            html += p_open;
        }
        else if(this.p.is('(') && this.p.is2('(')) {
            p_open = '(';
            p_close = ')';
            this.p.next();
        }
        else
            this.p.err('expected [ or (');
        let cols = -1;
        let rows = 0;
        while(this.p.is(p_open) || this.p.is(',')) {
            if(rows > 0) {
                this.p.terminal(',');
                html += ',';
            }
            this.p.terminal(p_open);
            html += p_open;
            let col = 0;
            while(!this.p.is(p_close)) {
                if(col > 0) {
                    this.p.terminal(',');
                    html += ',';
                }
                html += this.parseIM_Expr();
                col ++;
            }
            if(cols == -1)
                cols = col;
            else if(col != cols)
                this.p.err('matrix has different number of cols per row');
            this.p.terminal(p_close);
            html += p_close;
            rows ++;
        }
        if(rows < 1 || cols < 1)
            this.p.err('matrix must have at least one row and one column');
        this.p.terminal(p_close);
        html += p_close;
        return html;
    }

    // im_input =
    //   "#" [ "[" "diff" ID "]" ] ( 
    //       ID
    //     | "\"" (ID|INT) { "|" (ID|INT) } "\""    /* gap question text */
    //   );
    parseIM_Input() {
        let diffVar = '';
        let html = '';

        this.p.parseWhitespaces = false;
        this.p.parsingInlineCode = true;

        //let lex_backup = this.p.backupLexer();

        this.p.terminal('#');

        if(this.p.is("[")) {
            this.p.next();
            // properties
            if(this.p.is("diff")) {
                this.p.next();
                while(this.p.is(' '))
                    this.p.next();
                if(this.p.isIdent()) {
                    diffVar = this.p.tk;
                    this.p.next();
                } else
                    this.p.err("expected diff var");
            } else {
                this.p.err("unknown property '" + this.p.tk + "'");
            }
            this.p.terminal("]");
        }
        let sym=null, symId=''
        if(this.p.is('"')) {
            this.p.next();
            // gap question
            let gapTexts = []; // set of correct answers per gap
            let gapText = '';
            while(!this.p.is('"') && !this.p.is("§EOF")) {
                gapText += this.p.tk;
                this.p.next();
            }
            this.p.terminal('"');
            gapTexts.push(gapText);
            while(this.p.is("|")) {
                this.p.next();
                gapText = '';
                this.p.terminal('"');
                while(!this.p.is('"') && !this.p.is("§EOF")) {
                    gapText += this.p.tk;
                    this.p.next();
                }
                this.p.terminal('"');
                gapTexts.push(gapText);
            }
            symId = 'gap_' + this.p.createUniqueID();
            sym = new SellSymbol(symtype.T_STRING_LIST, gapTexts);
            this.p.q.solutionSymbols[symId] = sym;
        } else {
            this.p.codeParser.parseUnary();
            symId = 'sol'+this.p.createUniqueID();
            sym = this.p.q.stack.pop();
            this.p.q.lastParsedInputSymbol = sym;
            this.p.q.solutionSymbols[symId] = sym;
        }
        this.p.q.solutionSymbols[symId] = sym; // TODO: this is also done above!?!?!
        if(diffVar.length > 0)
            this.p.q.solutionSymbolsMustDiffFirst[symId] = diffVar;
        let inputId = 'sell_input_' + this.p.instanceID + '_' + this.p.qidx + '_' + symId;
        let inputWidth = 5;
        let isWideInput = false;
        let rows = 0, cols = 0, matrixInput = null;
        switch(sym.type) {
            case symtype.T_STRING:
            case symtype.T_STRING_LIST: // list := list of alternatives -> 1 box
                inputWidth += 10;
                html += ' <input type="text" value="" id="'+inputId+'" size="'+inputWidth+'" placeholder=""> ';
                break;
            case symtype.T_REAL:
            case symtype.T_FUNCTION:
                if(sym.type == symtype.T_FUNCTION)
                    inputWidth += 10;
                html += ' <input type="text" value="" id="'+inputId+'" size="'+inputWidth+'" placeholder=""> ';
                break;
            case symtype.T_COMPLEX:
                // -- real part --
                html += '<input type="text" name="sell_input" value="" id="'+inputId+'_real" size="' + inputWidth + '" placeholder=""> `+` ';
                // -- complex part --
                html += '<input type="text" name="sell_input" value="" id="'+inputId+'_imag" size="' + inputWidth + '" placeholder=""> `i` '; // TODO: make i<->j configurable
                break;
            case symtype.T_SET:
            case symtype.T_COMPLEX_SET:
                if(sym.type == symtype.T_COMPLEX_SET)
                    inputWidth += 5;
                html += '`{`';
                for(let i=0; i<sym.value.length; i++) {
                    if (i > 0)
                        html += ' , ';
                    html += ' <input type="text" name="sell_input" value="" id="'+inputId+'_'+i+'" size="' + inputWidth + '" placeholder=""> ';
                }
                html += '`}`';
                break;
            case symtype.T_MATRIX:
                isWideInput = false;
                rows = this.p.resizableRows ? 2 : LinAlg.SellLinAlg.mat_get_row_count(sym.value);
                cols = this.p.resizableCols ? 2 : LinAlg.SellLinAlg.mat_get_col_count(sym.value);
                matrixInput = new SellMatrixInput(this.p.environment, this.p.instanceID, inputId,
                    rows, cols, isWideInput, this.p.resizableRows, this.p.resizableCols);
                this.p.matrixInputs.push(matrixInput);
                // create only a span here, since matrices are resizable and thus must
                // be updatable
                html += '<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="'+inputId+'"></span>';
                break;
            case symtype.T_MATRIX_OF_FUNCTIONS:
                isWideInput = true;
                rows = this.p.resizableRows ? 2 : sym.value.m;
                cols = this.p.resizableCols ? 2 : sym.value.n;
                matrixInput = new SellMatrixInput(this.p.environment, this.p.instanceID, inputId,
                    rows, cols, isWideInput, this.p.resizableRows, this.p.resizableCols);
                this.p.matrixInputs.push(matrixInput);
                // create only a span here, since matrices are resizable and thus must
                // be updatable
                html += '<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="'+inputId+'"></span>';
                break;
            default:
                this.p.err("unimplemented solution type '" + sym.type + "'")
        }
        html += '<span id="sell_input_feedback_' + this.p.instanceID + '_' + this.p.qidx + '_' + symId + '"></span>';
        if(this.p.debug)
            html += '<span class="text-warning">' + sym.toAsciiMath() + '</span>';

        this.p.parsingInlineCode = false;
        this.p.parseWhitespaces = true;

        return html;
    }

}
