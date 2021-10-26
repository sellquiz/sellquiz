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

import { SellLinAlg } from './linalg.js';
import { SellQuiz, SellInput, SellInputElementType } from './quiz.js';
import { symtype, SellSymbol } from './symbol.js';
import { MatrixInput } from './matinput.js';
import { sellassert } from './sellassert.js';

export class ParseIM_Input {

    p : SellQuiz;

    constructor(parent : SellQuiz) {
        this.p = parent;
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
        
        // TODO
        let inputId = 'xxx'; //'sell_input_' + this.p.instanceID + '_' + this.p.qidx + '_' + symId;

        let inputWidth = 5;
        let isWideInput = false;
        let rows = 0, cols = 0, matrixInput = null;

        let input = new SellInput();
        input.htmlElementId = "sellquiz_input_" + symId;
        input.solutionVariableId = symId;
        input.solutionVariableRef = sym;
        input.htmlElementId_feedback = "sellquiz_feedback_" + symId;
        this.p.q.inputs.push(input);

        switch(sym.type) {

            case symtype.T_STRING:
            case symtype.T_STRING_LIST: // list := list of alternatives -> 1 box
                inputWidth += 10;
                input.htmlElementInputType = SellInputElementType.TEXTFIELD;
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += '$$' + input.htmlElementId;
                } else {
                    html += ' <input type="text" value="" id="' + input.htmlElementId + '" size="' + inputWidth + '" placeholder=""> ';
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;

            case symtype.T_REAL:
            case symtype.T_FUNCTION:
                if(sym.type == symtype.T_FUNCTION)
                    inputWidth += 10;
                input.htmlElementInputType = SellInputElementType.TEXTFIELD;
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += ' $$' + input.htmlElementId + ' ';
                    html += '$$' + input.htmlElementId_feedback + ' ';
                } else {
                    html += ' <input type="text" value="" id="' + input.htmlElementId + '" size="' + inputWidth + '" placeholder=""> ';
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;

            case symtype.T_COMPLEX:
                input.htmlElementInputType = SellInputElementType.COMPLEX_NUMBER;
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += ' $$' + input.htmlElementId + ' ';
                    html += '$$' + input.htmlElementId_feedback + ' ';
                } else {
                    // -- real part --
                    html += '<input type="text" name="sell_input" value="" id="' + input.htmlElementId + '_real" size="' + inputWidth + '" placeholder=""> `+` ';
                    // -- complex part --
                    html += '<input type="text" name="sell_input" value="" id="' + input.htmlElementId + '_imag" size="' + inputWidth + '" placeholder=""> `i` '; // TODO: make i<->j configurable
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;
    
            case symtype.T_SET:
            case symtype.T_COMPLEX_SET:
                if(sym.type == symtype.T_COMPLEX_SET)
                    inputWidth += 5;
                input.htmlElementInputType = SellInputElementType.VECTOR;
                input.vectorLength = sym.value.length;
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += ' $$' + input.htmlElementId + ' ';
                    html += '$$' + input.htmlElementId_feedback + ' ';
                } else {
                    html += '`{`';
                    for(let i=0; i<sym.value.length; i++) {
                        if (i > 0)
                            html += ' , ';
                        html += ' <input type="text" name="sell_input" value="" id="' + input.htmlElementId  + '_'+ i + '" size="' + inputWidth + '" placeholder=""> ';
                    }
                    html += '`}`';
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;

            case symtype.T_MATRIX:
            case symtype.T_MATRIX_OF_FUNCTIONS:
                isWideInput = sym.type == symtype.T_MATRIX_OF_FUNCTIONS;
                if(sym.type == symtype.T_MATRIX) {
                    rows = this.p.resizableRows ? 2 : SellLinAlg.mat_get_row_count(sym.value);
                    cols = this.p.resizableCols ? 2 : SellLinAlg.mat_get_col_count(sym.value);
                } else {
                    rows = this.p.resizableRows ? 2 : sym.value.m;
                    cols = this.p.resizableCols ? 2 : sym.value.n;
                }
                input.htmlElementInputType = SellInputElementType.MATRIX;
                input.matrixInput = new MatrixInput(
                    this.p.q, input, rows, cols, isWideInput, 
                    this.p.resizableRows, this.p.resizableCols);
                // create only a span here, since matrices are resizable and thus must be updatable
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += ' $$' + input.htmlElementId + ' ';
                    html += '$$' + input.htmlElementId_feedback + ' ';
                } else {
                    html += '<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="' + input.htmlElementId + '"></span>';
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;
            
            case symtype.T_PROGRAMMING:
                inputWidth += 10;
                input.htmlElementInputType = SellInputElementType.PROGRAMMING;
                if(this.p.generateInputFieldHtmlCode == false) {
                    html += '$$' + input.htmlElementId;
                } else {
                    html += '<div class="border p-0 m-0"><textarea class="form-control p-0" style="min-width: 100%;" id="' + input.htmlElementId + '" + rows="5"></textarea></div>';
                    html += '<span id="' + input.htmlElementId_feedback + '"></span>';
                }
                break;

            default:
                this.p.err("unimplemented solution type '" + sym.type + "'")
        }

        if(this.p.debug)
            html += '<span class="text-warning">' + sym.toAsciiMath() + '</span>';

        this.p.parsingInlineCode = false;
        this.p.parseWhitespaces = true;

        return html;
    }

}
