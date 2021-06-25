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

import { symtype, SellSymbol } from './symbol.js';
import { SellToken, Lexer } from './lex.js';
import { ParseText } from './parse-text.js';
import { ParseCode } from './parse-code.js';
import { ParseCodeSym } from './parse-code-sym.js';
import { ParseIM } from './parse-im.js';
import { ParseIM_Input } from './parse-im-input.js';
import { Evaluate } from './evaluate.js';
import { MatrixInput } from './matinput.js';
import { getHtmlChildElementRecursive } from './help.js';
import { check_symbol_svg } from './img.js'
import { sellassert } from './sellassert.js';

export enum SellInputElementType {
    UNKNOWN = "unknown",
    TEXTFIELD = "textfield", // one input box
    COMPLEX_NUMBER = "textflield", // two separate input boxes for real and imag
    CHECKBOX = "checkbox", // boolean checkbox
    VECTOR = "vector", // vector with n input boxes (also used for sets)
    MATRIX = "matrix" // matrix with m*n input boxes
}

export class SellInput {
    htmlElementId: string = "";
    htmlElementInputType: SellInputElementType = SellInputElementType.UNKNOWN;
    htmlElementId_feedback: string = "";
    solutionVariableId: string = "";    
    solutionVariableMathtype: symtype = symtype.T_UNKNOWN;
    // linearized input: one element for scalars, n elemens for vectors, m*n elements for matrices (row-major)
    studentAnswer: Array<string> = [];
    evaluationFeedbackStr: string = "";
    correct: boolean = false;
    // only used for matrix based mathtypes
    matrixInput: MatrixInput = null;
    // only used for vector based mathtypes
    vectorLength: number = 1;
}

export class SellQuestion {
    idx: number = 0;
    src: string = '';
    html: string = '';
    titleHtml: string = '';
    bodyHtml: string = '';
    bodyHtmlElement: HTMLElement = null;
    symbols: { [key: string]: SellSymbol } = {};
    solutionSymbols: { [key: string]: SellSymbol } = {};
    solutionSymbolsMustDiffFirst: { [key: string]: string } = {};
    lastParsedInputSymbol: SellSymbol = null;
    stack: Array<SellSymbol> = [];
    inputs : Array<SellInput> = [];
    
    generalFeedbackStr : string = "";
    allAnswersCorrect : boolean = false;
    // TODO: move parse method and other methods here
}

export class SellQuiz {

    evaluate: Evaluate;

    textParser: ParseText;
    codeParser: ParseCode;
    codeSymParser: ParseCodeSym;
    imParser: ParseIM;
    imInputParser: ParseIM_Input;

    ELEMENT_TYPE_INPUT: string = 'input';
    ELEMENT_TYPE_SPAN: string = 'span';

    debug: boolean = false;
    log: string = '';
    language: string = 'en';

    // questions
    questions: Array<SellQuestion> = [];
    q: SellQuestion = null; // current question
    qidx: number = 0; // current question index
    html: string = '';
    variablesJsonStr: string = ''; // TODO!!

    // lexer (remark: if attributes are changed, then methods backupLexer,
    //        and replayLexer must also be changed)
    tokens: Array<SellToken> = [];
    tk: string = '';
    tk2: string = '';
    tk_line: number = 0;
    tk_col: number = 0;
    tkIdx: number = 0;
    id: string = '';

    // parsing states
    parseWhitespaces: boolean = false;
    parsingInlineCode: boolean = false; // true while parsing solution code after '#'

    // style states
    isBoldFont: boolean = false;
    isItalicFont: boolean = false;
    isItemize: boolean = false;
    isItemizeItem: boolean = false;

    singleMultipleChoiceFeedbackHTML: string = ''; // written at end of line

    // matrix inputs
    //matrixInputs: Array<SellMatrixInput> = [];
    resizableRows: boolean = false;
    resizableCols: boolean = false;

    // unique id counter
    uniqueIDCtr: number = 0;
    editButton: boolean = false;

    constructor(debug = false) {
        // instantiate evaluation class
        this.evaluate = new Evaluate(this);
        // instantiate parser classes
        this.textParser = new ParseText(this);
        this.codeParser = new ParseCode(this);
        this.codeSymParser = new ParseCodeSym(this);
        this.imParser = new ParseIM(this);
        this.imInputParser = new ParseIM_Input(this);
    }

    importQuestions(sellCode : string) : boolean {
        sellCode = sellCode.split('STOP')[0];
        let sellCodeLines = sellCode.split("\n");
        let code = '';
        let codeStartRow = 0;
        for(let i=0; i<sellCodeLines.length; i++) {
            let line = sellCodeLines[i];
            if(line.startsWith("%%%")) {
                if(!this.importQuestion(code, codeStartRow))
                    return false;
                code = '';
                codeStartRow = i+1;
            } else {
                code += line + '\n';
            }
        }
        if(!this.importQuestion(code, codeStartRow))
            return false;
        // TODO:
        /*if(this.environment == "moodle") {
            for(let i=0; i<this.questions.length; i++) {
                let q = this.questions[i];
                this.variablesJsonStr = JSON.stringify({"symbols":q.symbols, "solutionSymbols":q.solutionSymbols}); // TODO: overwritten for every question!!
                let bp = 1337;
            }
        }*/
        return true;
    }

    importQuestion(src : string, codeStartRow = 0): boolean {

        this.resizableRows = false;
        this.resizableCols = false;

        this.tokens = [];
        this.tk = '';
        this.tk_line = 0;
        this.tk_col = 0;
        this.tk2 = ''; // look ahead 2
        this.tkIdx = 0;
        this.id = ''; // last identifier

        this.qidx = this.questions.length;

        this.q = new SellQuestion();
        this.q.idx = this.qidx;
        this.q.src = src;
        this.questions.push(this.q);
        let lines = src.split('\n');
        let indent1_last = false;
        let indent2_last = false;
        let code_block = false;
        for (let i = 0; i < lines.length; i++) {
            if (!code_block && lines[i].startsWith('```'))
                code_block = true;
            let indent2 = lines[i].startsWith('\t\t') || lines[i].startsWith('        ');
            let indent1 = lines[i].startsWith('\t') || lines[i].startsWith('    ');
            if (indent2)
                indent1 = false;
            let line_str = lines[i].split('%')[0]; // remove comments
            if (line_str.length == 0) // empty line
                continue;
            let lineTokens = Lexer.tokenize(line_str);
            if (lineTokens.length == 0)
                continue
            lineTokens.push(new SellToken('§EOL', i + 1, -1)); // end of line
            if (!code_block) {
                if (!indent1 && indent1_last)
                    this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
                //if(!indent2 && indent2_last)
                //    this.tokens.push(new SellToken('§HINT_END', i+1, -1));
                if (indent1 && !indent1_last)
                    this.tokens.push(new SellToken('§CODE_START', i + 1, -1));
                //if(indent2 && !indent2_last)
                //    this.tokens.push(new SellToken('§HINT_START', i+1, -1));
            }
            for (let j = 0; j < lineTokens.length; j++) {
                this.tokens.push(lineTokens[j]);
                this.tokens[this.tokens.length - 1].line = codeStartRow + i + 1;
            }
            indent1_last = indent1;
            indent2_last = indent2;
            if (code_block && lines[i].endsWith('```'))
                code_block = false;
        }
        this.tokens.push(new SellToken('§END', -1, -1));
        //console.log(this.tokens);
        //this.helper.printTokenList(this.tokens);
        this.tkIdx = 0;
        this.next();
        try {
            this.parse();
        } catch (e) {
            this.log += e + '\n';
            this.log += 'Error: compilation failed';
            return false;
        }
        if (this.tk !== '§END')
            this.err('Error: remaining tokens: "' + this.tk + '"...');
        this.log += '... compilation succeeded!\n';

        // --- permutate patterns '§['...']§' (shuffles single/multiple choice answers) ---
        // TODO: does NOT work for multiple groups of multiple-choice/single-choice
        let options = [];
        let n = this.q.html.length;
        let tmpHtml = '';
        // fill options-array and replace occurring patterns '§['...']§' by
        // '§i', with i := index of current option (0<=i<k, with  k   the total
        // number of options)
        for (let i = 0; i < n; i++) {
            let ch = this.q.html[i];
            let ch2 = i + 1 < n ? this.q.html[i + 1] : '';
            if (ch == '§' && ch2 == '[') {
                tmpHtml += '§' + options.length;
                options.push('');
                for (let j = i + 2; j < n; j++) {
                    ch = this.q.html[j];
                    ch2 = j + 1 < n ? this.q.html[j + 1] : '';
                    if (ch == ']' && ch2 == '§') {
                        i = j + 1;
                        break;
                    }
                    options[options.length - 1] += ch;
                }
            } else
                tmpHtml += ch;
        }
        // shuffle options
        let k = options.length;
        for (let l = 0; l < k; l++) {
            let i = Lexer.randomInt(0, k);
            let j = Lexer.randomInt(0, k);
            let tmp = options[i];
            options[i] = options[j];
            options[j] = tmp;
        }
        // reconstruct question-html
        for (let l = 0; l < k; l++)
            tmpHtml = tmpHtml.replace('§' + l, options[l]);
        this.q.html = tmpHtml;

        // --- set HTML ---
        this.html += this.q.html + '\n\n';
        return true;
    }

    getElementByIdAndType(id : string, type) {
        // TODO:!!!!!
        /*if (this.environment == "mumie") {
            // https://www.integral-learning.de/platform/
            let inputField;
            inputField = Array.from(document.getElementsByTagName(type))
                .filter((inputFields) => inputFields.id === id)
                .find((inputFields) => inputFields.offsetParent !== null);
            return inputField ? inputField : document.getElementById(id);
        } else {
            // standalone version
            return document.getElementById(id);
        }*/
        return document.getElementById(id);
    }

    backupLexer() { // backup lexer (used e.g. in code-loops)
        return {
            'tk': this.tk,
            'tk_line': this.tk_line,
            'tk_col': this.tk_col,
            'tk2': this.tk2,
            'tkIdx': this.tkIdx,
            'id': this.id
        }
    }

    replayLexer(lexState) { // replay lexer backup (used e.g. in code-loops)
        this.tk = lexState['tk'];
        this.tk_line = lexState['tk_line'];
        this.tk_col = lexState['tk_col'];
        this.tk2 = lexState['tk2'];
        this.tkIdx = lexState['tkIdx'];
        this.id = lexState['id'];
    }

    createUniqueID() {
        return "ID" + (this.uniqueIDCtr++);
    }

    updateMatrixInputs(questionID : number) : boolean {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.matrixInput != null)
                input.matrixInput.updateHTML();
        }
        return true;
    }

    updateMatrixDims(questionID : number, htmlElementId : string, 
        deltaRows : number, deltaCols : number) : boolean {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.matrixInput != null && input.htmlElementId == htmlElementId)
                input.matrixInput.resize(deltaRows, deltaCols);
        }
        return true;
    }

    next() {
        // look-ahead 1
        if (this.tkIdx >= this.tokens.length) {
            this.tk = '§END';
            this.tk_line = -1;
            this.tk_col = -1;
        }
        else {
            this.tk = this.tokens[this.tkIdx].str;
            this.tk_line = this.tokens[this.tkIdx].line;
            this.tk_col = this.tokens[this.tkIdx].col;
        }
        // look-ahead 2
        if (this.tkIdx + 1 >= this.tokens.length)
            this.tk2 = '§END';
        else
            this.tk2 = this.tokens[this.tkIdx + 1].str;
        this.tkIdx++;

        if (!this.parseWhitespaces && this.tk === ' ')
            this.next();

        // lexer hack for parsing inline code: e.g. ['a','_','b'] -> ['a_b']
        if (this.parsingInlineCode && Lexer.isIdentifier(this.tk)) {
            while (this.parsingInlineCode && this.tkIdx < this.tokens.length - 1 && this.tk !== '§END' && (this.tokens[this.tkIdx].str === '_' || Lexer.isIdentifier(this.tokens[this.tkIdx].str) || Lexer.isInteger(this.tokens[this.tkIdx].str))) {
                this.tk += this.tokens[this.tkIdx].str;
                this.tk_line = this.tokens[this.tkIdx].line;
                this.tk_col = this.tokens[this.tkIdx].col;
                this.tkIdx++;
            }
        }
        if (!this.parseWhitespaces && this.tk === ' ')
            this.next();
    }

    err(msg) {
        throw 'Error:' + this.tk_line + ':' + this.tk_col + ': ' + msg;
    }

    terminal(t) {
        if (this.tk === t)
            this.next();
        else
            this.err(t == "§EOL" ? "expected linebreak, got '" + this.tk + "'" : "expected '" + t + "'");
    }

    ident() {
        if (this.isIdent()) {
            this.id = this.tk;
            this.next();
        } else
            this.err("expected identifier");
    }

    isIdent() { return Lexer.isIdentifier(this.tk); }

    isNumber() {
        return !isNaN(this.tk as any);
    }

    isInt() {
        return Lexer.isInteger(this.tk);
    }

    is(s) {
        return this.tk === s;
    }

    is2(s) {
        return this.tk2 === s;
    }

    isNumberInt(v) {
        return Math.abs(v - Math.round(v)) < 1e-6;
    }

    pushSym(type, value, precision = 1e-9) {
        this.q.stack.push(new SellSymbol(type, value, precision));
    }

    charToHTML(c) {
        switch (c) {
            case '§EOL': return '<br/>\n';
            default: return c;
        }
    }

    // sell = 
    //   title { code | text };
    parse() {
        this.textParser.parseTitle();
        this.q.html = "";
        while (!this.is('§END')) {
            if (this.is("§CODE_START"))
                this.codeParser.parseCode();
            else
                this.textParser.parseText();
        }
        this.q.bodyHtml = this.q.html;
        this.createHighLevelHTML();
    }

    createHighLevelHTML() {
        // create high-level HTML:
        this.q.html  = '<div id="sell_question_html_element_' + this.q.idx + '" class="card">\n';
        this.q.html += '<div class="card-header">\n';
        this.q.html += '    <h5 class="card-title m-0">' + this.q.titleHtml + '</h5>\n';
        this.q.html += '    <a name="question-' + (this.questions.length-1) + '"></a>\n';
        this.q.html += '</div>\n';
        this.q.html += '<div class="card-body p-4">\n'; // ** begin body        
        this.q.html += this.q.bodyHtml;
        this.q.html += '</div>\n'; // ** end body (begins in keyword 'TITLE')
        // ** footer:
        this.q.html += '<div class="card-footer bg-white pl-4 pt-2 pb-1 m-0">';
        this.q.html += '<span>';
        // submit button
        this.q.html += '<input type="image" id="button-evaluate" onclick="sellquiz.autoEvaluateQuiz(' + this.qidx + ', \'sell_question_html_element_' + this.q.idx + '\');" height="28px" src=\"' + check_symbol_svg + '\" title="evaluate"></input>';
        // edit button
        if (this.editButton) {
            // TODO
            this.q.html += '&nbsp;&nbsp;<button type="button" class="btn btn-link" onclick="editSellQuestion(' + this.qidx + ')">edit</button>';
        }
        // general feedback
        this.q.html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="general_feedback"></span>';
        // end
        this.q.html += '</span>';
        this.q.html += '</div>'; // *** end of card-footer
        this.q.html += '</div>\n'; // *** end of card
        this.q.html += '<br/>';
    }

    getQuestionByIdx(idx: number): SellQuestion {
        if (idx < 0 || idx >= this.questions.length)
            return null;
        return this.questions[idx];
    }

    enableInputFields(questionID : number, enable : boolean = true) {
        let q = this.getQuestionByIdx(questionID);
        if(q == null)
            return false;
        if(q.bodyHtmlElement == null)
            sellassert(false, "enableInputFields(): q.bodyHtmlElement was not set");
        for(let i=0; i<q.inputs.length; i++) {
            let element = getHtmlChildElementRecursive(q.bodyHtmlElement, q.inputs[i].htmlElementId);
            (<HTMLInputElement>element).disabled = !enable;
        }
        return true;
    }

} // end of class Sell
