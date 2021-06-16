// TODO: img/check-square.svg
// TODO: asserts

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

import * as math from 'mathjs';

import * as LinAlg from './linalg.js';
import * as Symbolic from './symbolic.js';

// TODO:
function assert(exp, msg='') {
    if(!exp) { 
        alert(msg);
    } 
}

const symtype = {
    T_UNKNOWN: "T_UNKNOWN", T_REAL: "T_REAL", T_DOTS: "T_DOTS", T_SET: "T_SET", 
    T_BOOL: "T_BOOL", T_FUNCTION: "T_FUNCTION", T_COMPLEX: "T_COMPLEX", T_COMPLEX_SET: "T_COMPLEX_SET",
    T_MATRIX: "T_MATRIX", T_MATRIX_DEF: "T_MATRIX_DEF", T_MATRIX_TRANSPOSE: "T_MATRIX_TRANSPOSE",
    T_STRING: "T_STRING", T_STRING_LIST: "T_STRING_LIST"
}

class SellSymbol {
    constructor(type=symtype.UNKNOWN, value=null, precision=1e-9) {
        this.type = type;
        this.value = value;
        this.precision = precision;
        this.user_value = '';
        this.hint_html = '';
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
                s = this.value.toString();
                s = s.replaceAll("[","(").replaceAll("]",")"); // TODO: must be configurable
                return s;
            default:
                assert(false, "unimplemented SellSymbol::toAsciiMath(..)");
        }
    }
}

class SellQuestion {
    constructor() {
        this.src = '';
        this.html = '';
        this.symbols = {};
        this.lastParsedInputSymbol = null;
        this.solutionSymbols = {};
        this.solutionSymbolsMustDiffFirst = {};
        this.stack = [];
    }
}

class Sell {
    constructor(language="en", instanceID="sell", debug=false, environment="standalone") {

        assert(true);

        this.ELEMENT_TYPE_INPUT = 'input';
        this.ELEMENT_TYPE_SPAN = 'span';
        //
        this.debug = debug;
        this.log = '';
        this.language = language;
        this.instanceID = instanceID;
        this.environment = environment;
        //this.sellMatrixInputInstances = [];
        // questions
        this.questions = [];
        this.q = null; // current question
        this.qidx = 0; // current question index
        this.html = '';
        this.variablesJsonStr = '';
        // lexer (remark: if attributes are changed, then methods backupLexer,
        //        and replayLexer must also be changed)
        this.tokens = [];
        this.tk = '';
        this.tk_line = 0;
        this.tk_col = 0;
        this.tk2 = ''; // look ahead 2
        this.tkIdx = 0;
        this.id = ''; // last identifier
        this.parsingInlineCode = false; // true while solution code after '#'
        // style states
        this.isBoldFont = false;
        this.isItalicFont = false;
        this.isItemize = false;
        this.isItemizeItem = false;
        this.singleMultipleChoiceFeedbackHTML = ''; // written at end of line
        // matrix inputs
        this.matrixInputs = [];
        this.resizableRows = false;
        this.resizableCols = false;
        // unique id counter
        this.uniqueIDCtr = 0;
        //
        this.editButton = false;
    }
    getElementByIdAndType(id, type) {
        if(this.environment == "mumie") {
            // https://www.integral-learning.de/platform/
            let inputField;
            inputField = Array.from(document.getElementsByTagName(type))
                .filter((inputFields) => inputFields.id === id)
                .find((inputFields) => inputFields.offsetParent !== null);
            return inputField ? inputField : document.getElementById(id);
        } else {
            // standalone version
            return document.getElementById(id);
        }
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
    updateMatrixInputs() {
        for(let i=0; i<this.matrixInputs.length; i++) {
            this.matrixInputs[i].updateHTML();
        }
    }
    resizeMatrixInput(matrixId, diffM, diffN) {
        for(let i=0; i<this.matrixInputs.length; i++) {
            if(this.matrixInputs[i].id === matrixId) {
                this.matrixInputs[i].resize(diffM, diffN);
                break;
            }
        }
    }    
    importQuestions(sellCode) {
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
        if(this.environment == "moodle") {
            for(let i=0; i<this.questions.length; i++) {
                let q = this.questions[i];
                this.variablesJsonStr = JSON.stringify({"symbols":q.symbols, "solutionSymbols":q.solutionSymbols}); // TODO: overwritten for every question!!
                let bp = 1337;
            }
        }
        return true;
    }
    importQuestion(src, codeStartRow=0) {

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
        this.q.src = src;
        this.questions.push(this.q);
        let lines = src.split('\n');
        let indent1_last = false;
        let indent2_last = false;
        let code_block = false;
        for(let i=0; i<lines.length; i++) {
            if(!code_block && lines[i].startsWith('```'))
                code_block = true;
            let indent2 = lines[i].startsWith('\t\t') || lines[i].startsWith('        ');
            let indent1 = lines[i].startsWith('\t') || lines[i].startsWith('    ');
            if(indent2)
                indent1 = false;
            let line_str = lines[i].split('%')[0]; // remove comments
            if(line_str.length == 0) // empty line
                continue;
            let lineTokens = Lexer.tokenize(line_str);
            if(lineTokens.length==0)
                continue
            lineTokens.push(new SellToken('§EOL', i+1, -1)); // end of line
            if(!code_block) {
                if(!indent1 && indent1_last)
                    this.tokens.push(new SellToken('§CODE_END', i+1, -1));
                //if(!indent2 && indent2_last)
                //    this.tokens.push(new SellToken('§HINT_END', i+1, -1));
                if(indent1 && !indent1_last)
                    this.tokens.push(new SellToken('§CODE_START', i+1, -1));
                //if(indent2 && !indent2_last)
                //    this.tokens.push(new SellToken('§HINT_START', i+1, -1));
            }
            for(let j=0; j<lineTokens.length; j++) {
                this.tokens.push(lineTokens[j]);
                this.tokens[this.tokens.length-1].line = codeStartRow + i+1;
            }
            indent1_last = indent1;
            indent2_last = indent2;
            if(code_block && lines[i].endsWith('```'))
                code_block = false;
        }
        this.tokens.push(new SellToken('§END', -1, -1));
        //console.log(this.tokens);
        //this.helper.printTokenList(this.tokens);
        this.tkIdx = 0;
        this.next();
        try {
            this.parse();
        } catch(e) {
            this.log += e + '\n';
            this.log += 'Error: compilation failed';
            return false;
        }        
        if(this.tk !== '§END')
            return this.error('Error: remaining tokens: "' + this.tk + '"...');   
        this.log += '... compilation succeeded!\n';

        // --- permutate patterns '§['...']§' (shuffles single/multiple choice answers) ---
        // TODO: does NOT work for multiple groups of multiple-choice/single-choice
        let options = [];
        let n = this.q.html.length;
        let tmpHtml = '';
        // fill options-array and replace occurring patterns '§['...']§' by
        // '§i', with i := index of current option (0<=i<k, with  k   the total
        // number of options)
        for(let i=0; i<n; i++) {
            let ch = this.q.html[i];
            let ch2 = i+1<n ? this.q.html[i+1] : '';
            if(ch=='§' && ch2=='[') {
                tmpHtml += '§'+options.length;
                options.push('');
                for(let j=i+2; j<n; j++) {
                    ch = this.q.html[j];
                    ch2 = j+1<n ? this.q.html[j+1] : '';
                    if(ch==']'&&ch2=='§') {
                        i = j+1;
                        break;
                    }
                    options[options.length-1] += ch;
                }
            } else
                tmpHtml += ch;
        }
        // shuffle options
        let k = options.length;
        for(let l=0; l<k; l++) {
            let i = Lexer.randomInt(0, k);
            let j = Lexer.randomInt(0, k);
            let tmp = options[i];
            options[i] = options[j];
            options[j] = tmp;
        }
        // reconstruct question-html
        for(let l=0; l<k; l++)
            tmpHtml = tmpHtml.replace('§'+l, options[l]);
        this.q.html = tmpHtml;

        // --- set HTML ---
        this.html += this.q.html + '\n\n';
        return true;
    }
    next() {
        
        // look-ahead 1
        if(this.tkIdx >= this.tokens.length) {
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
        if(this.tkIdx+1 >= this.tokens.length)
            this.tk2 = '§END';
        else
            this.tk2 = this.tokens[this.tkIdx+1].str;
        this.tkIdx ++;

        if(!this.parseWhitespaces && this.tk === ' ')
            this.next();

        // lexer hack for parsing inline code: e.g. ['a','_','b'] -> ['a_b']
        if(this.parsingInlineCode && Lexer.isIdentifier(this.tk)) {
            while(this.parsingInlineCode && this.tkIdx < this.tokens.length-1 &&  !this.tk !== '§END' && (this.tokens[this.tkIdx].str === '_' || Lexer.isIdentifier(this.tokens[this.tkIdx].str) || Lexer.isInteger(this.tokens[this.tkIdx].str))) {
                this.tk += this.tokens[this.tkIdx].str;
                this.tk_line = this.tokens[this.tkIdx].line;
                this.tk_col = this.tokens[this.tkIdx].col;
                this.tkIdx ++;
            }
        }

        if(!this.parseWhitespaces && this.tk === ' ')
            this.next();
    }

    err(msg) { throw 'Error:' + this.tk_line + ':' + this.tk_col + ': ' + msg; }
    terminal(t) { if(this.tk === t) this.next(); else this.err(t=="§EOL" ? "expected linebreak, got '" + this.tk + "'" : "expected '" + t + "'"); }
    ident() { if(this.isIdent(this.tk)) { this.id = this.tk; this.next(); } else this.err("expected identifier"); }
    isIdent() { return Lexer.isIdentifier(this.tk); }
    isNumber() { return !isNaN(this.tk); }
    isInt() { return Lexer.isInteger(this.tk); }
    is(s) { return this.tk === s; }
    is2(s) { return this.tk2 === s; }
    pushSym(type, value, precision=1e-9) {
        this.q.stack.push(new SellSymbol(type, value, precision));
    }
    charToHTML(c) {
        switch(c) {
            case '§EOL': return '<br/>\n';
            default: return c;
        }
    }

    // sell = 
    //   title { code | text };
    parse() {
        this.q.html += '<div class="card">\n';
        this.parseTitle();
        while(!this.is('§END')) {
            if(this.is("§CODE_START"))
                this.parseCode();
            else
                this.parseText();
        }
        this.q.html += '</div>\n'; // ** end body (begins in keyword 'TITLE')
        // ** footer:
        this.q.html += '<div class="card-footer bg-white pl-4 pt-2 pb-1 m-0">';
        this.q.html += '<span>';
        // submit button
        if(this.environment !== "moodle") {
            this.q.html += '<input id="button-evaluate" type="image" onclick="' + this.instanceID + '.evaluateUserInput(' + this.qidx + ')" height="28px" src="img/check-square.svg" title="evaluate"/>';
        }
        // edit button
        if(this.editButton) {
            this.q.html += '&nbsp;&nbsp;<button type="button" class="btn btn-link" onclick="editSellQuestion(' + this.qidx + ')">edit</button>';
            //<input id="button-evaluate" type="text" onclick="editSellQuestion(' + this.q.src + ')" height="28px" title="evaluate">edit</input>';
        }
        // general feedback
        this.q.html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="sell_input_feedback_' + this.instanceID + '_' + this.qidx + '_general_feedback"></span>';
        // end
        this.q.html += '</span>';
        this.q.html += '</div>'; // *** end of card-footer
        this.q.html += '</div>\n'; // *** end of card
        this.q.html += '<br/>';
    }

    // title = 
    //   { ID | "#" ID | MISC } "\n";
    parseTitle() {
        this.parseWhitespaces = true;
        let title = '';
        while(!this.is('§EOL') && !this.is('§END')) {
            if(this.isIdent()) {
                title += this.tk;
                this.next();
            } else if(this.is('#')) {
                this.next()
                if(this.isIdent()) {
                    let tag = this.tk; // TODO: yet unused
                    this.next();
                }
                else
                    this.err("expected identifer after '#'");
            } else {
                title += this.charToHTML(this.tk);
                this.next();
            }
        }
        this.terminal('§EOL');
        this.parseWhitespaces = false;
        this.q.html += '<div class="card-header">\n';
        this.q.html += '    <h5 class="card-title m-0">' + title + '</h5>\n';
        this.q.html += '    <a name="question-' + (this.questions.length-1) + '"></a>\n';
        this.q.html += '</div>\n';
        this.q.html += '<div class="card-body p-4">\n'; // ** begin body
    }

    // code = 
    //   "§CODE_START" { (code_prop | code_hint | assign) "\n" } "§CODE_END";
    parseCode() {
        this.terminal('§CODE_START');
        while(!this.is('§CODE_END') && !this.is('§END')) {
            if(this.is("input"))
                this.parseCodeProp();
            else if(this.is('?'))
                this.parseCodeHint();
            else
                this.parseAssign();
            this.terminal('§EOL');
        }
        if(!this.is("§END"))
            this.terminal('§CODE_END');
    }

    // code_prop = 
    //   "input" ("rows"|"cols") ":=" ("resizeable"|"static");
    parseCodeProp() {
        if(this.is("input"))
            this.next();
        else
            this.err("expected input");
        let isRows = false;
        if(this.is("rows")) {
            this.next();
            isRows = true;
        } else if(this.is("cols")) {
            this.next();
            isRows = false;
        } else
            this.err("expected 'rows' or 'cols'");
        this.terminal(":=");
        let isResizable = true;
        if(this.is("resizable")) {
            this.next();
            isResizable = true;
        } else if(this.is("static")) {
            this.next();
            isResizable = false;
        } else
            this.err("expected 'resizable' or 'static'");
        if(isRows)
            this.resizableRows = isResizable;
        else
            this.resizableCols = isResizable;
    }

    // code_hint = 
    //   "?" text;
    parseCodeHint() {
        if(this.is("?"))
            this.next();
        else
            this.err("expected ?");
        let hintSym = this.q.lastParsedInputSymbol;
        if(hintSym == null)
            this.err("Hint/explanation is forbidden, since there is no preceding input field");
        let htmlLen = this.q.html.length;
        this.parseText(true/*parsingHint=true*/);
        hintSym.hint_html = this.q.html.substr(htmlLen);
        this.q.html = this.q.html.substr(0, htmlLen);
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
        this.q.stack = [];
        // set of left-hand side (lhs) variables
        let isFunction = false;
        let lhsIDs = [];
        let lhsSymbolIDs = []; // e.g. for "f(x,y)", we call "x" and "y" symbols
        let lhsMatrixIndexed = false;
        let lhsMatrixRow=0, lhsMatrixCol=0;
        this.ident();
        lhsIDs.push(this.id);
        if(this.id === 'i' || this.id === 'e') { // TODO: also test for functions names, ...
            this.err("id '" + this.id +"' is a reserved symbol");
        }
        if(this.is("(")) { // function / symbolic term
            isFunction = true;
            this.next();
            this.ident();
            lhsSymbolIDs.push(this.id);
            while(this.is(",")) {
                this.next();
                this.ident();
                lhsSymbolIDs.push(this.id);
            }
            this.terminal(")");
        } else if(this.is("[")) { // matrix indexing
            this.next();
            lhsMatrixIndexed = true;
            // row
            this.parseExpr();
            let tos = this.q.stack.pop(); // tos := top of stack
            if(tos.type != symtype.T_REAL || !Lexer.isInteger(tos.value))
                this.err("row index is not an integer value");
            lhsMatrixRow = tos.value;
            // separator
            this.terminal(",");
            // columns
            this.parseExpr();
            tos = this.q.stack.pop(); // tos := top of stack
            if(tos.type != symtype.T_REAL || !Lexer.isInteger(tos.value))
                this.err("column index is not an integer value");
            lhsMatrixCol = tos.value;
            // end
            this.terminal("]");
        } else { // list of lhs-variables only allowed for non-functions
            while(this.is(",")) {
                this.next();
                this.ident();
                lhsIDs.push(this.id);
            }
        }
        // assignment
        if(this.is(':=') || this.is('=')) {
            this.next();
            if(isFunction)
                this.parseSymbolicTerm(lhsSymbolIDs);
            else
                this.parseExpr();
            let rhs = this.q.stack.pop();
            if(lhsMatrixIndexed) {
                if(rhs.type != symtype.T_REAL)
                    this.err("right-hand side must be of type real");
                if(!(lhsIDs[0] in this.q.symbols))
                    this.err("unkown symbol '" + lhsIDs[0] + "'");
                let lhs = this.q.symbols[lhsIDs[0]];
                if(lhs.type != symtype.T_MATRIX)
                    this.err("symbol '" + lhsIDs[0] + "' is not a matrix");
                lhs.value = LinAlg.SellLinAlg.mat_set_element(
                    lhs.value, lhsMatrixRow-1, lhsMatrixCol-1, rhs.value);
                if(lhs.value == null)
                    this.err("invalid indices");
            } else {
                for(let i=0; i<lhsIDs.length; i++)
                    this.q.symbols[lhsIDs[i]] = rhs;
            }
        }
        // choose element of right-hand side (rhs)
        else if(this.is('in')) {
            if(isFunction)
                this.err("cannot apply 'in' to a function")
            this.next();
            if(this.is('MM')) { // matrix
                this.parseMatrixDef();
                let rhs = this.q.stack.pop(); /* rhs is a matrix definition */
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
                                value.subset(math.index(i, j), element);
                            }
                        }
                        if(symmetric) {
                            for (let i=1; i<m; i++) {
                                for (let j=0; j<i; j++) {
                                    let element = value.subset(math.index(i, j));
                                    value = value.subset(math.index(j, i), element);
                                }
                            }
                        }
                        if(!invertible)
                            break;
                        if(iterations > 256)
                            this.err("matrix generation failed: too many iterations");
                        iterations ++;
                    } while(math.abs(math.det(value)) < 1e-16/*TODO:epsilon*/);
                    this.q.symbols[lhsIDs[k]] = new SellSymbol(symtype.T_MATRIX, value);
                }
            } else if(this.is('{') || this.isIdent()) { // set
                if(this.is('{')) // TODO: move this to parseUnary!
                    this.parseSet();
                else
                    this.parseExpr();
                let rhs = this.q.stack.pop();
                if(rhs.type != symtype.T_SET)
                    this.err("expected a set");
                // run until (optional) constrains are met
                let lex_backup = this.backupLexer();
                let ctr = 0;
                while(true) {
                    if(ctr > 1000)
                        this.err("constraints for random variables cannot be fulfilled");
                    ctr ++;
                    for(let i=0; i<lhsIDs.length; i++) {
                        let value = this.chooseFromSet(rhs.value);
                        this.q.symbols[lhsIDs[i]] = new SellSymbol(symtype.T_REAL, value);
                    }
                    // optional constraint(s)
                    this.replayLexer(lex_backup);
                    if(this.is('with')) {
                        this.next();
                        this.parseExpr();
                        let tos = this.q.stack.pop(); // tos := top of stack
                        if(tos.type != symtype.T_BOOL)
                            this.err("constraint must be boolean");
                        if(tos.value)
                            break;
                    }
                    else
                        break; // if no constraints are set: stop
                }
            } else
                this.err("unexpected '" + this.tk + "'");
        }
        else
            this.err("expected ':=' or '=' or 'in'");
    }

    // matrix_def = 
    //   "MM" "(" expr "x" expr "|" expr [ {"," ("invertible"|"symmetric")} ] ")";
    parseMatrixDef() {
        this.terminal("MM");
        this.terminal("(");
        // number of rows
        this.parseExpr();
        let m = this.q.stack.pop();
        if(m.type !== symtype.T_REAL || !this.isNumberInt(m.value))
            this.err("expected integer for the number of rows");
        m = math.round(m.value);
        if(m <= 0)
            this.err("number of matrix cols must be > 0 (actually is '" + m + "')")
        // times
        this.terminal("x");
        // number of columns
        this.parseExpr();
        let n = this.q.stack.pop();
        if(n.type !== symtype.T_REAL || !this.isNumberInt(n.value))
            this.err("expected integer for the number of columns");
        n = math.round(n.value);
        if(n <= 0)
            this.err("number of matrix rows must be > 0 (actually is '" + n + "')")
        // set
        this.terminal("|");
        this.parseExpr();
        let set = this.q.stack.pop();
        if(set.type !== symtype.T_SET)
            this.err("expected set from which matrix elements are drawn");
        // properties
        let invertible = false;
        let symmetric = false;
        while(this.is(",")) {
            this.next();
            let prop = this.tk;
            switch(prop) {
                case 'invertible': invertible = true; break;
                case 'symmetric': symmetric = true; break;
                default:
                    this.err("unknown property '" + prop +"'");
            }
            this.next();
        }
        // end
        this.terminal(")");
        // create symbol
        this.pushSym(symtype.T_MATRIX_DEF, [m, n, set, invertible, symmetric]);
    }

    // set = 
    //   "{" [ expr { "," expr } ] "}";
    parseSet() {
        this.terminal("{");
        let idx = 0;
        let sym = new SellSymbol(symtype.T_SET);
        sym.value = [];
        let hasDot = false;
        while(!this.is('}') && !this.is('§EOF')) {
            if(idx > 0)
                this.terminal(",");
            this.parseExpr();
            let symi = this.q.stack.pop();
            sym.value.push(symi);
            if(symi.type !== symtype.T_REAL) {
                if(idx==2 && symi.type === symtype.T_DOTS)
                    hasDot = true;
                else if(symi.type === symtype.T_COMPLEX)
                    sym.type = symtype.T_COMPLEX_SET;
                else 
                    this.err("set must consist of real values only");
            }
            idx ++;
        }
        if(hasDot && idx != 4 || hasDot && sym.type == symtype.T_COMPLEX_SET)
            this.err("if set contains '...', then it must have 4 real-valued elements")
        if(sym.type == symtype.T_COMPLEX_SET) {
            for(let i=0; i<sym.value.length; i++) {
                if(sym.value[i].type == symtype.T_REAL)
                    sym.value[i].value = math.complex(sym.value[i].value, 0);
            }
        }
        this.q.stack.push(sym);
        this.terminal("}");
    }

    // symbolic_term = 
    //   symbolic_term_add;
    parseSymbolicTerm(lhsSymbolIDs) {
        let symterm = new Symbolic.SellSymTerm(lhsSymbolIDs);
        this.parseSymbolicTerm_Add(symterm);
        symterm.optimize();
        this.q.stack.push(new SellSymbol(symtype.T_FUNCTION, symterm));
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
        while(this.is("+") || this.is("-")) {
            let op = this.tk;
            this.next();
            this.parseSymbolicTerm_Mul(symterm);
            symterm.pushBinaryOperation(op);
        }
    }

    // symbolic_term_mul = 
    //   symbolic_term_pow { ("*"|"/") symbolic_term_pow };
    parseSymbolicTerm_Mul(symterm) {
        this.parseSymbolicTerm_Pow(symterm);
        while(this.is("*") || this.is("/")) {
            let op = this.tk;
            this.next();
            this.parseSymbolicTerm_Pow(symterm);
            symterm.pushBinaryOperation(op);
        }
    }

    // symbolic_term_pow = 
    //   symbolic_term_unary { "^" symbolic_term_unary };
    parseSymbolicTerm_Pow(symterm) {
        this.parseSymbolicTerm_Unary(symterm);
        while(this.is("^")) {
            let op = this.tk;
            this.next();
            this.parseSymbolicTerm_Unary(symterm);
            symterm.pushBinaryOperation(op);
        }
    }

    // symbolic_term_unary = 
    //     "(" symbolic_term_expr ")" 
    //   | INT ["!"] 
    //   | FLOAT
    //   | ("exp"|"sin"|"cos") "(" symbolic_term_expr ")"
    //   | "diff" "(" symbolic_term_expr "," ID  ")"
    //   | ID 
    //   | ID "(" [ expr { "," epxr } ] ")"
    //   | "-" symbolic_term_pow;
    parseSymbolicTerm_Unary(symterm) {
        if(this.is("(")) {
            this.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            this.terminal(")");
        } else if(this.isNumber()) {
            let value = parseFloat(this.tk);
            this.next();
            if(this.is("!")) {
                if(!this.isNumberInt(value))
                    this.err("expected integer for '!'");
                this.next();
                value = math.factorial(value);
            }
            symterm.pushConstant(value);
        } else if(["exp","sin","cos"].includes(this.tk)) {
            // functions with 1 parameter
            let fctId = this.tk;
            this.next();
            this.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            this.terminal(")");
            symterm.pushUnaryFunction(fctId);
        } else if(this.is("diff")) {
            this.next();
            this.terminal("(");
            this.parseSymbolicTerm_Expr(symterm);
            //let diff_fct = symterm.stack[symterm.stack.length - 1];
            /*this.ident();
            let diff_fctId = this.id;
            if((diff_fctId in this.q.symbols) == false)
                this.err("unknown function '" + diff_fctId + "'");
            let diff_fct = this.q.symbols[diff_fctId];
            if(symterm.symbolIDs.length != diff_fct.value.symbolIDs.length)
                this.err("cannot apply diff(): set of variables does not correspond to left-hand side");
            for(let i=0; i<symterm.symbolIDs.length; i++) {
                if(symterm.symbolIDs[i] !== diff_fct.value.symbolIDs[i])
                    this.err("cannot apply diff(): set of variables does not correspond to left-hand side");
            }*/
            /*TODO: if(diff_fct.type !== symtype.T_FUNCTION)
                this.err("first parameter of 'diff' must be a function");*/
            this.terminal(",");
            this.ident();
            let diff_symId = this.id;
            this.terminal(")");
            symterm.pushVariable(diff_symId);
            /*TODO: if(!diff_fct.value.symbolIDs.includes(diff_symId))
                this.err("cannot apply diff(): '" + diff_symId + "' is not a variable of function '" + diff_fctId + "'");*/
            //let diff = diff_fct.value.derivate(diff_symId);
            //symterm.pushSymbolicTerm(diff);
            symterm.pushDiff();
        } else if(this.isIdent()) {
            let id = this.tk;
            this.next();
            if(id in this.q.symbols) {
                let symbol = this.q.symbols[id];
                if(symbol.type === symtype.T_REAL)
                    symterm.pushConstant(symbol.value);
                else if(symbol.type == symtype.T_FUNCTION) {
                    if(this.is("(")) {
                        let evalParameters = [];
                        this.terminal("(");
                        while(!this.is(")") && !this.is("§EOF")) {
                            if(evalParameters.length > 0)
                                this.terminal(",");
                            this.parseExpr(); // must be an evaluted term, not a symbolic term!
                            let evalParameter = this.q.stack.pop();
                            if(evalParameter.type !== symtype.T_REAL)
                                this.err("paremeter must be of type 'real'");
                            evalParameters.push(evalParameter.value);
                        }
                        this.terminal(")");
                        if(symbol.value.symbolIDs.length != evalParameters.length)
                            this.err("number of parameters does not match definition of function '" + id + "'");
                        let varValues = {};
                        for(let i=0; i<symbol.value.symbolIDs.length; i++)
                            varValues[symbol.value.symbolIDs[i]] = evalParameters[i];
                        symterm.pushConstant(symbol.value.eval(varValues));
                    } else {
                        symterm.pushSymbolicTerm(symbol.value);
                    }
                }
                else
                    this.err("identifer '" + id + "' must be of type 'real'");
            } else
                symterm.pushVariable(id); // TODO: check, if it is in symbolIDs (member of SellSymbolicTerm) or a known function
        } else if(this.is("-")) {
            this.next();
            this.parseSymbolicTerm_Pow(symterm);
            symterm.pushUnaryOperation("-");
        } else
            this.err("expected unary");
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
        if(this.is('or')) {
            let op = this.tk;
            this.next();
            parseAnd();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_BOOL && o2.type == symtype.T_BOOL) {
                this.pushSym(symtype.T_BOOL, o1.value || o2.value);
            } else
                this.err("types not compatible for '" + op + "' (must be boolean)");
        }
    }

    // and =
    //   equal [ "and" equal ];
    parseAnd() {
        this.parseEqual();
        if(this.is('and')) {
            let op = this.tk;
            this.next();
            parseEqual();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_BOOL && o2.type == symtype.T_BOOL) {
                this.pushSym(symtype.T_BOOL, o1.value && o2.value);
            } else
                this.err("types not compatible for '" + op + "' (must be boolean)");
        }
    }

    // equal =
    //   compare [ ("=="|"!=") compare ];
    parseEqual() {
        this.parseCompare();
        if(this.is('==') || this.is('!=')) {
            let op = this.tk;
            this.next();
            this.parseCompare();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                let isEqual = math.abs(o1.value-o2.value) < 1e-14;
                switch(op) {
                    case '==': this.pushSym(symtype.T_BOOL, isEqual); break;
                    case '!=': this.pushSym(symtype.T_BOOL, !isEqual); break;
                }
            } else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                let isEqual = LinAlg.SellLinAlg.mat_compare_numerically(o1.value, o2.value);
                switch(op) {
                    case '==': this.pushSym(symtype.T_BOOL, isEqual); break;
                    case '!=': this.pushSym(symtype.T_BOOL, !isEqual); break;
                }
            } else
                this.err("types not compatible for '" + op + "'");
        }
    }

    // compare =
    //   add [ ("<="|"<"|">="|">") add ];
    parseCompare() {
        this.parseAdd();
        if(this.is('<=') || this.is('<') || this.is('>=') || this.is('>')) {
            let op = this.tk;
            this.next();
            this.parseAdd();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '<=': this.pushSym(symtype.T_BOOL, o1.value <= o2.value); break;
                    case '<':  this.pushSym(symtype.T_BOOL, o1.value < o2.value); break;
                    case '>=': this.pushSym(symtype.T_BOOL, o1.value >= o2.value); break;
                    case '>':  this.pushSym(symtype.T_BOOL, o1.value > o2.value); break;
                }
            } else
                this.err("types not compatible for '" + op + "'");
        }
    }

    // add =
    //   mul { ("+"|"-") mul };
    parseAdd() {
        this.parseMul();
        while(this.is('+') || this.is('-')) {
            let op = this.tk;
            this.next();
            this.parseMul();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '+': this.pushSym(symtype.T_REAL, o1.value + o2.value); break;
                    case '-': this.pushSym(symtype.T_REAL, o1.value - o2.value); break;
                }
            } 
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '+': this.pushSym(symtype.T_COMPLEX, math.add(o1.value, o2.value)); break;
                    case '-': this.pushSym(symtype.T_COMPLEX, math.subtract(o1.value, o2.value)); break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                let o1_m = o1.value.size()[0]; let o1_n = o1.value.size()[1];
                let o2_m = o2.value.size()[0]; let o2_n = o2.value.size()[1];
                if(o1_m != o2_m || o1_n != o2_n)
                    this.err("cannot apply '" + op + "' on (" + o1_m + "x" + o1_n + ") and (" + o2_m + "x" + o2_n + ") matrices");
                this.pushSym(symtype.T_MATRIX, op=="+" ? math.add(o1.value, o2.value) : math.subtract(o1.value, o2.value));
            }
            else
                this.err("types not compatible for '" + op + "'");
        }
    }

    // mul =
    //   pow { ("*"|"/"|"mod") pow };
    parseMul() {
        this.parsePow();
        while(this.is('*') || this.is('/') || this.is('mod')) {
            let op = this.tk;
            this.next();
            this.parsePow();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '*': this.pushSym(symtype.T_REAL, o1.value * o2.value); break;
                    case '/': this.pushSym(symtype.T_REAL, o1.value / o2.value); break;
                    case 'mod':
                        if(!this.isNumberInt(o1.value) || !this.isNumberInt(o2.value))
                            this.err("operator 'mod' expectes integral operands");
                        this.pushSym(symtype.T_REAL, math.mod(math.round(o1.value), math.round(o2.value)));
                        break;
                }
            }
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '*': this.pushSym(symtype.T_COMPLEX, math.multiply(o1.value, o2.value)); break;
                    case '/': this.pushSym(symtype.T_COMPLEX, math.divide(o1.value, o2.value)); break;
                    case 'mod':
                        this.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX) {
                switch(op) {
                    case '*':
                        let o1_m = o1.value.size()[0]; let o1_n = o1.value.size()[1];
                        let o2_m = o2.value.size()[0]; let o2_n = o2.value.size()[1];
                        if(o1_n != o2_m)
                            this.err("cannot multiply (" + o1_m + "x" + o1_n + ") and (" + o2_m + "x" + o2_n + ") matrices");
                        this.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    case '/':
                    case 'mod':
                        this.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '*':
                        this.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    case 'mod':
                        // TODO: must test, if all elements of matrix are integral!
                        if(!this.isNumberInt(o2.value))
                            this.err("operator 'mod' expectes integral operands");
                        this.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_mod(o1.value, o2.value));
                        break;
                    default:
                        console.log(o1.value.toString())
                        this.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else if(o1.type == symtype.T_REAL && o2.type == symtype.T_MATRIX) {
                switch(op) {
                    case '*':
                        this.pushSym(symtype.T_MATRIX, math.multiply(o1.value, o2.value));
                        break;
                    default:
                        this.err("types not compatible for '" + op + "'");
                        break;
                }
            }
            else
                this.err("types not compatible for '" + op + "'");
        }
    }

    // pow =
    //   unary { ("^") unary };
    parsePow() {
        this.parseUnary();
        while(this.is('^')) {
            let op = this.tk;
            this.next();
            this.parseUnary();
            let o2 = this.q.stack.pop();
            let o1 = this.q.stack.pop();
            if(o1.type == symtype.T_REAL && o2.type == symtype.T_REAL) {
                switch(op) {
                    case '^': this.pushSym(symtype.T_REAL, math.pow(o1.value, o2.value)); break;
                }
            }
            else if(   (o1.type == symtype.T_REAL || o1.type == symtype.T_COMPLEX) 
                    && (o2.type == symtype.T_REAL || o2.type == symtype.T_COMPLEX)) {
                switch(op) {
                    case '^': this.pushSym(symtype.T_COMPLEX, math.pow(o1.value, o2.value)); break;
                }
            }
            else if(o1.type == symtype.T_MATRIX && o2.type == symtype.T_MATRIX_TRANSPOSE) {
                switch(op) {
                    case '^': this.pushSym(symtype.T_MATRIX, math.transpose(o1.value)); break;
                }
            }
            else
                this.err("types not compatible for '" + op + "'");
        }
    }

    // unary = (
    //     "-" unary;
    //   | INT
    //   | "true" | "false"
    //   | "i" | "j" | "T"
    //   | function_call
    //   | ID
    //   | "..."
    //   | matrix
    //   | "(" expr ")"
    // ) [ factorial ];
    parseUnary() {
        if(this.is('-')) {
            this.next();
            this.parseUnary();
            let o = this.q.stack.pop();
            if(o.type == symtype.T_REAL)
                this.pushSym(symtype.T_REAL, - o.value);
            else
                this.err("unary '-' must be followed by type real");
        } else if(this.isInt()) {
            let value = parseInt(this.tk);
            this.next();
            this.q.stack.push(new SellSymbol(symtype.T_REAL, value));
        } else if(this.is("true")) {
            this.next();
            this.q.stack.push(new SellSymbol(symtype.T_BOOL, true));
        } else if(this.is("false")) {
            this.next();
            this.q.stack.push(new SellSymbol(symtype.T_BOOL, false));
        } else if(this.is("i") || this.is("j")) {
            this.q.stack.push(new SellSymbol(symtype.T_COMPLEX, math.complex(0,1)));
            this.next();
        } else if(this.is("T")) {
            this.q.stack.push(new SellSymbol(symtype.T_MATRIX_TRANSPOSE, "T"));
            this.next();
        } else if(this.getFunctionList().includes(this.tk)) {
            this.parseFunctionCall();
        } else if(this.isIdent()) {
            let id = this.tk;
            this.next();
            if((id in this.q.symbols) == false)
                this.err("unknown identifier '" + id + "'");
            this.q.stack.push(this.q.symbols[id]);
        } else if(this.is("...")) {
            this.next();
            this.q.stack.push(new SellSymbol(symtype.T_DOTS));
        } else if(this.is("{")) {
            this.parseSet();
        } else if(this.is("[")) {
            this.parseMatrix();
        } else if(this.is("(")) {
            this.next();
            this.parseExpr();
            this.terminal(")");
        } else
            this.err("expected unary, got '" + this.tk + "'");
        // postfix
        if(this.is('!'))
            this.parseFactorial();
    }

    // matrix =
    //   "[" "[" expr {"," expr} "]" { "," "[" expr {"," expr} "]" } "]";
    parseMatrix() {
        this.terminal('[');
        let cols = -1;
        let rows = 0;
        let elements = [];
        while(this.is('[') || this.is(',')) {
            if(rows > 0)
                this.terminal(',');
            this.terminal('[');
            let col = 0;
            while(!this.is(']') && !this.is('§EOF')) {
                if(col > 0)
                    this.terminal(',');
                this.parseExpr();
                let element = this.q.stack.pop();
                if(element.type != symtype.T_REAL)
                    this.err("matrix element must be real valued");
                elements.push(element.value);
                col ++;
            }
            if(cols == -1)
                cols = col;
            else if(col != cols)
                this.err('matrix has different number of cols per row');
            this.terminal(']');
            rows ++;
        }
        if(rows < 1 || cols < 1)
            this.err('matrix must have at least one row and one column');
        this.terminal(']');
        // create matrix:
        let matrix = math.zeros(rows, cols);
        assert(elements.length == rows*cols);
        for(let i=0; i<rows; i++) {
            for(let j=0; j<cols; j++) {
                matrix = LinAlg.SellLinAlg.mat_set_element(matrix, i, j, elements[i*cols+j]);
            }
        }
        this.q.stack.push(new SellSymbol(symtype.T_MATRIX, matrix));
    }

    isNumberInt(v) {
        return Math.abs(v - Math.round(v)) < 1e-6;
    }

    getFunctionList() {
        return ['abs','binomial','integrate','conj','sqrt','xgcd','det','rank','inv','eye',
            'eigenvalues_sym','triu','sin','cos','asin','acos','tan','atan','norm2','dot','cross',
            'linsolve', 'is_zero'];
    }

    // function_call = 
    //   ("abs"|"binomial"|"integrate"|"conj"|"sqrt"|"xgcd"|"det"|"rank"|"inv"
    //      |"eye"|"eigenvalues_sym"|"triu"|"sin"|"cos"|"asin"|"acos"|"tan"
    //      |"atan"|"norm2"|"dot"|"cross"|"linsolve"| "is_zero")
    //   ID "(" [ expr {"," expr} ] ")";
    parseFunctionCall() {
        this.ident();
        let functionName = this.id;
        this.terminal('(');
        // get parameters =: p
        let p = [];
        while(!this.is(')') && !this.is('§EOL') && !this.is('§EOF')) {
            if(p.length > 0)
                this.terminal(',');
            if(functionName == "integrate" && p.length==1) {
                // second parametr of "integrate" must be a string
                this.ident();
                p.push(this.id);
            } else {
                this.parseExpr();
                p.push(this.q.stack.pop());
            }
        }
        this.terminal(')');
        // calculate
        if(functionName === 'abs') {
            if(p.length != 1 || (p[0].type != symtype.T_REAL && p[0].type != symtype.T_COMPLEX))
                this.err("signature must be 'abs(real|complex)'");
            this.pushSym(symtype.T_REAL, math.abs(p[0].value));
        } else if(functionName === 'sqrt') {
            if(p.length != 1 || (p[0].type != symtype.T_REAL && p[0].type != symtype.T_COMPLEX))
                this.err("signature must be 'sqrt(real|complex)'");
            let v = math.sqrt(p[0].value);
            let isComplex = math.typeOf(v) == 'Complex';
            this.pushSym(isComplex ? symtype.T_COMPLEX : symtype.T_REAL, v);

        } else if(['sin','asin','cos','acos','tan','atan'].includes(functionName)) {
            if(p.length != 1 || p[0].type != symtype.T_REAL)
                this.err("signature must be '" + functionName + "(real)'");
            let v=0.0;
            switch(functionName) {
                case 'sin': v = math.sin(p[0].value); break;
                case 'asin': v = math.asin(p[0].value); break;
                case 'cos': v = math.cos(p[0].value); break;
                case 'acos': v = math.acos(p[0].value); break;
                case 'tan': v = math.tan(p[0].value); break;
                case 'atan': v = math.atan(p[0].value); break;
                default: this.err("UNIMPLEMENTED: " + functionName)
            }
            this.pushSym(symtype.T_REAL, v);
        } else if(functionName === 'conj') {
            if(p.length != 1 || p[0].type != symtype.T_COMPLEX)
                this.err("signature must be 'conj(complex)'");
                this.pushSym(symtype.T_COMPLEX, math.conj(p[0].value));
        } else if(functionName === 'binomial') {
            if(p.length != 2 || p[0].type != symtype.T_REAL || p[1].type != symtype.T_REAL
                || !this.isNumberInt(p[0].value) || !this.isNumberInt(p[1].value))
                this.err("signature must be 'binomial(int,int)'");
            this.pushSym(symtype.T_REAL, math.combinations(math.round(p[0].value), math.round(p[1].value)));
        } else if(functionName === 'xgcd') {
            if(p.length != 3 || p[0].type != symtype.T_REAL || p[1].type != symtype.T_REAL
                || p[2].type != symtype.T_REAL
                || !this.isNumberInt(p[0].value) || !this.isNumberInt(p[1].value)
                || !this.isNumberInt(p[2].value))
                this.err("signature must be 'xgcd(int,int,int)'");
                this.pushSym(symtype.T_REAL, math.subset(math.xgcd(p[0].value, p[1].value), 
                    math.index(p[2].value - 1)));
        }
        else if(functionName === 'integrate') {
            if(p.length != 4 || p[0].type != symtype.T_FUNCTION || typeof(p[1]) !== 'string'
                || p[2].type != symtype.T_REAL || p[3].type != symtype.T_REAL )
                this.err("signature must be 'integrate(function, string, real, real)'");
            let v = p[0].value.integrateNumerically(p[1], p[2].value, p[3].value);
            let precision = 0.001;
            this.pushSym(symtype.T_REAL, v, precision);
        }
        else if(['det','rank','inv','eigenvalues_sym','triu','norm2'].includes(functionName)) {
            if(p.length != 1 || p[0].type != symtype.T_MATRIX)
                this.err("signature must be '" + functionName + "(matrix)'");
            if(functionName === 'det')
                this.pushSym(symtype.T_REAL, math.det(p[0].value));
            else if(functionName === 'rank')
                this.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_rank(p[0].value));
            else if(functionName === 'inv')
                this.pushSym(symtype.T_MATRIX, math.inv(p[0].value));
            else if(functionName === 'eigenvalues_sym') {
                if(!LinAlg.SellLinAlg.mat_is_symmetric(p[0].value))
                    this.err("matrix is not symmetric");
                let eigs = math.eigs(p[0].value).values._data;
                let set = [];
                for(let i=0; i<eigs.length; i++)
                    set.push(new SellSymbol(symtype.T_REAL, eigs[i]));
                this.pushSym(symtype.T_SET, set);
            } else if(functionName === 'triu') {
                this.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_triu(p[0].value));
            } else if(functionName === 'norm2') {
                this.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_norm2(p[0].value));
            } else
                assert(false);
        }
        else if(functionName === 'eye') {
            if(p.length != 1 || p[0].type != symtype.T_REAL || !this.isNumberInt(p[0].value))
                this.err("signature must be 'eye(integer)'");
            this.pushSym(symtype.T_MATRIX, math.identity(math.round(p[0].value)));
        }
        else if(functionName === 'dot') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != 1)
                this.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.err("signature must be 'dot(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[1].value))
                this.err("vectors in 'dot(..)' must have equal length");
            this.pushSym(symtype.T_REAL, LinAlg.SellLinAlg.mat_vecdot(p[0].value, p[1].value));
        }
        else if(functionName === 'cross') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != 1)
                this.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.err("signature must be 'cross(columnVector,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != 3)
                this.err("vectors in 'cross(..)' must have length 3");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[1].value) != 3)
                this.err("vectors in 'cross(..)' must have length 3");
            this.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.mat_veccross(p[0].value, p[1].value));
        }
        else if(functionName === 'linsolve') {
            if(p.length != 2 || p[0].type != symtype.T_MATRIX || p[1].type != symtype.T_MATRIX)
                this.err("signature must be 'linsolve(matrix,columnVector)'");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[0].value))
                this.err("matrix must be square, i.e. m=n");
            if(LinAlg.SellLinAlg.mat_get_col_count(p[1].value) != 1)
                this.err("second parameter must be a colum vector");
            if(LinAlg.SellLinAlg.mat_get_row_count(p[0].value) != LinAlg.SellLinAlg.mat_get_row_count(p[1].value))
                this.err("number of rows of matrix and does not match vector");
            this.pushSym(symtype.T_MATRIX, LinAlg.SellLinAlg.linsolve(p[0].value, p[1].value));
        }
        else if(functionName === 'is_zero') {
            if(p.length != 1 || p[0].type != symtype.T_MATRIX)
                this.err("signature must be 'is_zero(matrix)'");
            this.pushSym(symtype.T_BOOL, LinAlg.SellLinAlg.mat_is_zero(p[0].value));
        }
        else
            this.err("unimplemented function call '" + functionName + "'");
    }

    // factorial =
    //   "!";
    parseFactorial() {
        this.terminal('!');
        let op = '!';
        let o = this.q.stack.pop();
        if(o.type == symtype.T_REAL)
            this.pushSym(symtype.T_REAL, math.factorial(o.value));
        else
            this.err("types not compatible for '" + op + "'");
    }

    endItemizeIfApplicable() {
        if(this.isItemizeItem)
            this.q.html += '</li>';
        if(this.isItemize)
            this.q.html += '</ul>';
        this.isItemizeItem = false;
        this.isItemize = false;
    }

    // text = 
    //   { single_multiple_choice | itemize | inline_listing | listing
    //     | inline_math | im_input | ID | MISC };
    parseText(parsingHint=false) {
        this.parseWhitespaces = true;
        while(!this.is('§END') && !this.is('§CODE_START')) {
            if(parsingHint && this.is("§EOL"))
                break;
            // end itemize, if applicable
            if(this.tk_col == 1 && !this.is('*'))
                this.endItemizeIfApplicable();
            // parse
            if(this.is('§EOL') && this.singleMultipleChoiceFeedbackHTML.length > 0) {
                this.q.html += '&nbsp;&nbsp;' + this.singleMultipleChoiceFeedbackHTML;
                this.singleMultipleChoiceFeedbackHTML = '';
                this.q.html += ']§'; // end of single-multiple choice
            }
            if(this.is('§EOL') && this.isItemizeItem) {
                this.next();
                this.q.html += '</li>';
                this.isItemizeItem = false;
            }
            else if(this.tk_col == 1 && this.is("["))
                this.parseSingleMultipleChoice(false/*multiple choice*/);
            else if(this.tk_col == 1 && this.is("("))
                this.parseSingleMultipleChoice(true/*single choice*/);
            else if(this.tk_col == 1 && this.is('*'))
                this.parseItemize();
            else if(this.is('`'))
                this.q.html += this.parseInlineListing();
            else if(this.is('```'))
                this.q.html += this.parseListing();
            else if(this.is('$'))
                this.parseInlineMath();
            else if(this.is('#'))
                this.q.html += this.parseIM_Input();
            else if(this.isIdent()) {
                // "__"/"_" are used to stard and end bold/italic font.
                // Tokens include underscores in general for most part of SELL, especially the code part.
                // Splitting is done here for text.
                let tokens = Lexer.splitStringAndKeepDelimiters(this.tk, ["__","_"]);
                this.next();
                for(let i=0; i<tokens.length; i++) {
                    if(tokens[i] === '_') {
                        this.isItalicFont = !this.isItalicFont;
                        this.q.html += this.isItalicFont ? '<i>' : '</i>';
                    } else if(tokens[i] === '__') {
                        this.isBoldFont = !this.isBoldFont;
                        this.q.html += this.isBoldFont ? '<b>' : '</b>';
                    } else
                       this.q.html += tokens[i];
                }
            }
            else {
                this.q.html += this.charToHTML(this.tk);
                this.next();
            }
        }
        this.parseWhitespaces = false;
        this.endItemizeIfApplicable();
    }

    // itemize =
    //   "*";
    parseItemize() {
        this.terminal('*');
        if(this.isItemize == false) {
            this.q.html += '<ul>';
        }
        this.isItemize = true;
        this.isItemizeItem = true;
        this.q.html += '<li>';
    }

    // single_multiple_choice =
    //     "(" ("x"|expr) ")"
    //   | "[" ("x"|expr) "]";
    parseSingleMultipleChoice(isSingleChoice) { // TODO: permutation!
        this.parseWhitespaces = false;
        let correct=false;
        if(isSingleChoice)
            this.terminal("(");
        else
            this.terminal("[");
        if(this.is("x")) {
            this.next();
            correct = true;
        } else if(!this.is("]") && !this.is(")") && !this.is(' ')) {
            this.parseExpr();
            let v = this.q.stack.pop();
            if(v.type != symtype.T_BOOL)
                this.err("expression must be boolean");
            correct = v.value;
        }
        if(isSingleChoice)
            this.terminal(")");
        else
            this.terminal("]");
        this.parseWhitespaces = true;

        let sym = new SellSymbol(symtype.T_BOOL, correct);
        let symId = (isSingleChoice?"_sc_":"_mc_") + this.createUniqueID();
        this.q.symbols[symId] = sym;
        this.q.solutionSymbols[symId] = sym;
        let inputId = 'sell_input_' + this.instanceID + '_' + this.qidx + '_' + symId;
        let inputType = isSingleChoice ? "radio" : "checkbox";
        let checked = "";

        this.q.html += '\n§[';
        this.q.html += '<input id="' + inputId + '" type="' + inputType + '" name="sell_input" ' + checked + '/>&nbsp;';

        this.singleMultipleChoiceFeedbackHTML = '&nbsp;<span id="sell_input_feedback_' + this.instanceID + '_' + this.qidx + '_' + symId + '"></span>\n';
    }

    // inline_listing =
    //   "`" { MISC } "`";
    parseInlineListing() {
        let html = '';
        this.terminal('`');
        html += '<code class="text-primary">';
        while(!this.is('`') && !this.is('§END')) {
            html += this.tk;
            this.next();
        }
        this.terminal('`');
        html += '</code>';
        return html;
    }

    // listing =
    //   "```" { MISC } "```";
    parseListing() {
        let code = '';
        this.terminal('```');
        while(!this.is('```') && !this.is('§END')) {
            if(this.is("§EOL")) {
                code += '\n';
                this.next();
                while(this.is(" ")) {
                    code += '&nbsp;';
                    this.next();
                }
            }
            else if(this.is("\t")) {
                code += '&nbsp;&nbsp;&nbsp;&nbsp;';
                this.next();
            } else {
                code += this.tk;
                this.next();
            }
        }
        code = code.replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n','<br/>');
        this.terminal('```');
        let html = '';
        html += '<hr class="mt-2 mb-0"/>';
        html += '<code class="text-primary">';
        html += code;
        html += '</code>';
        html += '<hr class="mt-0 mb-0"/>';
        return html;
    }

    // inline_math =
    //   "$" { im_expr } "$";
    parseInlineMath() {
        let html = '';
        this.terminal('$');
        html += ' \`';
        while(!this.is('$') && !this.is('§END'))
            html += this.parseIM_Expr();
        html += '\` ';
        this.terminal('$');
        this.q.html += ' <span style="font-size: 13pt;">' +  html.replaceAll('\`\`','') + '</span> ';
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
        while(this.is(',') || this.is(':') || this.is('->') || this.is('|->')) {
            let op = this.tk; 
            this.next(); 
            html += ' ' + op + ' ' + this.parseIM_Assign();
        }
        return html;
    }

    // im_assign =
    //   im_other_binary_op "=" im_other_binary_op;
    parseIM_Assign() {
        let html = this.parseIM_OtherBinaryOp();
        while(this.is('=')) { 
            this.next(); 
            html = html + ' = ' + this.parseIM_OtherBinaryOp();
        }
        return html;
    }

    // im_other_binary_op =
    //   im_relational { ("in"|"notin"|"uu"|"^^"|"vv"|"@") } im_relational;
    parseIM_OtherBinaryOp() {
        let html = this.parseIM_Relational();
        //    element of       not element of      union            logical and      logical or       circ
        while(this.is('in') || this.is('notin') || this.is('uu') || this.is('^^') || this.is('vv') || this.is('@')) {
            let op = this.tk;
            this.next();
            html = html + ' ' + op + ' ' + this.parseIM_Relational();
        }
        return html;
    }

    // im_relational = 
    //   im_add { ("<"|"<="|">"|">="|"!=") im_add };
    parseIM_Relational() {
        let html = this.parseIM_Add();
        while(this.is('<') || this.is('<=') || this.is('>') || this.is('>=') || this.is('!=')) {
            let op = this.tk;
            this.next();
            html = html + ' ' + op + ' ' + this.parseIM_Add();
        }
        return html;
    }

    // im_add =
    //   im_mul { ("+"|"-") im_mul };
    parseIM_Add() {
        let html = this.parseIM_Mul();
        while(this.is('+') || this.is('-')) {
            let op = this.tk;
            this.next();
            html = html + ' ' + op + ' ' + this.parseIM_Mul();
        }
        return html;
    }

    // im_mul =
    //   im_pow { ("*"|"/") im_pow };
    parseIM_Mul() {
        let html = this.parseIM_Pow();
        while(this.is('*') || this.is('/')) {
            let op = this.tk;
            this.next();
            html = html + ' ' + op + ' ' + this.parseIM_Pow();
        }
        return html;
    }

    // im_pow =
    //   im_unary { "^" im_unary };
    parseIM_Pow() {
        let html = this.parseIM_Unary();
        while(this.is('^')) {
            let op = this.tk;
            this.next();
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
        if(this.is('#'))
            html += '\`' + this.parseIM_Input() + '\`'; // '\`' ends and restarts math-jax env
        else if(this.is('text')) {
            this.next();
            this.terminal('(');
            html += ' \` ';
            while(!this.is(")") && !this.is("§EOF")) {
                html += this.tk;
                this.next();
            }
            html += ' \` ';
            this.terminal(')');
        }
        else if(this.is('augmented')) {
            this.next();
            this.terminal('(');
            let A=null, b=null;
            if(this.isIdent()) { // TODO: does not allow variable names with '_' yet
                if((this.tk in this.q.symbols) && this.q.symbols[this.tk].type == symtype.T_MATRIX)
                    A = this.q.symbols[this.tk].value;
                else
                    this.err("expected a matrix");
                this.next();
            } else
                this.err("expected a matrix");
            this.terminal('|');
            if(this.isIdent()) { // TODO: does not allow variable names with '_' yet
                if((this.tk in this.q.symbols) && this.q.symbols[this.tk].type == symtype.T_MATRIX)
                    b = this.q.symbols[this.tk].value;
                else
                    this.err("expected a column vector");
                this.next();
            } else
                this.err("expected a column vector");
            this.terminal(')');
            // construct augmented matrix in ASCIIMATH (e.g. "((a,b,|,c),(d,e,|,f))")
            let m = LinAlg.SellLinAlg.mat_get_row_count(A);
            let n = LinAlg.SellLinAlg.mat_get_col_count(A);
            if(LinAlg.SellLinAlg.mat_get_col_count(b) != 1)
                this.err("expected a column vector");
            if(LinAlg.SellLinAlg.mat_get_row_count(b) != n)
                this.err("matrix rows and vector rows not matching");
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
        else if(this.is('sum') || this.is('prod') || this.is('lim') || this.is('int')) {
            html += ' ' + this.tk;
            this.next();
            if(this.is('_')) {
                this.next();
                html += '_' + this.parseIM_Expr();
            }
            if(this.is('^')) {
                this.next();
                html += '^' + this.parseIM_Expr();
            }
            html += ' ';
        }
        else if(this.is('RR') || this.is('ZZ') || this.is('QQ') || this.is('CC')) {
            html += this.tk + " ";
            this.next();
        }
        else if(this.is('oo') || this.is('infty')) { // infinity
            html += this.tk + " ";
            this.next();
        }
        else if(this.is('equiv') || this.is('mod')) {
            html += this.tk + " ";
            this.next();
        }
        else if(this.is('EE') || this.is('AA')) {
            html += this.tk + " ";
            this.next();
            html += this.parseIM_Expr();
        }
        else if(this.is('dx') || this.is('dy') || this.is('dz')) {
            html += '\\ \\ ' + this.tk;
            this.next();
        }
        else if(this.is('bar')) {
            html += this.tk + " ";
            this.next();
            html += this.parseIM_Unary();
        }
        else if(this.is('-')) {
            this.next();
            html += '-';
            html += this.parseIM_Unary();
        }
        else if(this.is(' ')) {
            html += ' ';
            this.next();
        }
        else if(this.isNumber()) {
            html += this.tk;
            this.next();
        }
        else if(this.isIdent()) {
            let id = this.tk;
            this.next();
            while(this.tk == '_') {
                id += '_';
                this.next();
                if(this.isIdent() || this.isNumber()) {
                    id += this.tk;
                    this.next();
                }
            }
            if(id in this.q.symbols) {
                if(this.q.symbols[id].type == symtype.T_MATRIX && this.is("[")) { // submatrix
                    let i=0, j=0, allRows=false, allCols=false;
                    this.next();
                    // row
                    if(this.is(":")) {
                        this.next();
                        allRows = true;
                    }
                    else if(this.isInt()){
                        i = parseInt(this.tk);
                        this.next();
                    } else
                        this.err("expected integer for matrix row");
                    // separator
                    this.terminal(",");
                    // col
                    if(this.is(":")) {
                        this.next();
                        allCols = true;
                    }
                    else if(this.isInt()){
                        j = parseInt(this.tk);
                        this.next();
                    } else
                        this.err("expected integer for matrix col");
                    // end
                    this.terminal("]");
                    let symbol = this.q.symbols[id];
                    if(symbol.type != symtype.T_MATRIX)
                        this.err("'" + id + "' is not a matrix");
                    let first_row = allRows ? 0 : i-1;
                    let last_row = allRows ? -1 : i-1;
                    let first_col = allCols ? 0 : j-1;
                    let last_col = allCols ? -1 : j-1;
                    let submat = LinAlg.SellLinAlg.mat_submatrix(
                        symbol.value, first_row, last_row, first_col, last_col);
                    if(submat == null)
                        this.err("invalid indices");
                    html += submat.toString(); // TODO: toAsciiMath()! (requires symbol!)
                } else
                    html += this.q.symbols[id].toAsciiMath();
            }
            else
                html += id;
        }
        else if(this.is('"')) {
            this.next();
            this.ident();
            let id = this.id;
            while(this.tk == '_') {
                id += '_';
                this.next();
                if(this.isIdent() || this.isNumber()) {
                    id += this.tk;
                    this.next();
                }
            }
            html += id;
            this.terminal('"');
        }
        else if(this.is('(')) {
            this.next();
            html += '(';
            while(!this.is(')') && !this.is("§EOF"))
                html += this.parseIM_Expr();
            this.terminal(')');
            html += ')';
        }
        else if(this.is('{')) {
            this.next();
            html += '{ ';
            while(!this.is("}") && !this.is("§EOF"))
                html += this.parseIM_Expr();
            this.terminal('}');
            html += ' }';
        }
        else if(this.is('|')) {
            this.next();
            html += '|';
        }
        else if(this.is('\\')) { // spacing
            this.next();
            html += '\\ \\ ';
        }
        else if(this.is('\\\\') || this.is('setminus')) {
            this.next();
            html += 'setminus';
        }
        else if(this.is('...')) {
            this.next();
            html += '... ';
        }
        else if((this.is('[') && this.is2('[')) || (this.is('(') && this.is2('('))) {
            html += this.parseIM_Matrix();
        }
        else if(this.is('[') || this.is(']')) {
            html += this.tk;
            this.next();
            while(!this.is("]") && !this.is("[") && !this.is("§EOF"))
                html += this.parseIM_Expr();
            if(this.is('[') || this.is(']')) {
                html += this.tk;
                this.next();
            } else
                this.err("expected '[' or ']'");
        }
        else
            this.err("expected unary, got '" + this.tk + "'");
        // postfix
        if(this.is('!')) {
            this.next();
            html += '! ';
        }
        while(this.is("'")) {
            this.next();
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
        if(this.is('[') && this.is2('[')) {
            p_open = '[';
            p_close = ']';
            this.next();
            html += p_open;
        }
        else if(this.is('(') && this.is2('(')) {
            p_open = '(';
            p_close = ')';
            this.next();
        }
        else
            this.err('expected [ or (');
        let cols = -1;
        let rows = 0;
        while(this.is(p_open) || this.is(',')) {
            if(rows > 0) {
                this.terminal(',');
                html += ',';
            }
            this.terminal(p_open);
            html += p_open;
            let col = 0;
            while(!this.is(p_close)) {
                if(col > 0) {
                    this.terminal(',');
                    html += ',';
                }
                html += this.parseIM_Expr();
                col ++;
            }
            if(cols == -1)
                cols = col;
            else if(col != cols)
                this.err('matrix has different number of cols per row');
            this.terminal(p_close);
            html += p_close;
            rows ++;
        }
        if(rows < 1 || cols < 1)
            this.err('matrix must have at least one row and one column');
        this.terminal(p_close);
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

        this.parseWhitespaces = false;
        this.parsingInlineCode = true;

        //let lex_backup = this.backupLexer();

        this.terminal('#');

        if(this.is("[")) {
            this.next();
            // properties
            if(this.is("diff")) {
                this.next();
                while(this.is(' '))
                    this.next();
                if(this.isIdent()) {
                    diffVar = this.tk;
                    this.next();
                } else
                    this.err("expected diff var");
            } else {
                this.err("unknown property '" + this.tk + "'");
            }
            this.terminal("]");
        }
        let sym=null, symId=''
        if(this.is('"')) {
            this.next();
            // gap question
            let gapTexts = []; // set of correct answers per gap
            let gapText = '';
            while(!this.is('"') && !this.is("§EOF")) {
                gapText += this.tk;
                this.next();
            }
            this.terminal('"');
            gapTexts.push(gapText);
            while(this.is("|")) {
                this.next();
                gapText = '';
                this.terminal('"');
                while(!this.is('"') && !this.is("§EOF")) {
                    gapText += this.tk;
                    this.next();
                }
                this.terminal('"');
                gapTexts.push(gapText);
            }
            symId = 'gap_' + this.createUniqueID();
            sym = new SellSymbol(symtype.T_STRING_LIST, gapTexts);
            this.q.solutionSymbols[symId] = sym;
        } else {
            this.parseUnary();
            symId = 'sol'+this.createUniqueID();
            sym = this.q.stack.pop();
            this.q.lastParsedInputSymbol = sym;
            this.q.solutionSymbols[symId] = sym;
        }
        this.q.solutionSymbols[symId] = sym; // TODO: this is also done above!?!?!
        if(diffVar.length > 0)
            this.q.solutionSymbolsMustDiffFirst[symId] = diffVar;
        let inputId = 'sell_input_' + this.instanceID + '_' + this.qidx + '_' + symId;
        let inputWidth = 5;
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
                let rows = this.resizableRows ? 2 : LinAlg.SellLinAlg.mat_get_row_count(sym.value);
                let cols = this.resizableCols ? 2 : LinAlg.SellLinAlg.mat_get_col_count(sym.value);
                let matrixInput = new SellMatrixInput(this.environment, this.instanceID, inputId,
                    rows, cols, false/*wide input*/, this.resizableRows, this.resizableCols);
                this.matrixInputs.push(matrixInput);
                // create only a span here, since matrices are resizable and thus must
                // be updatable
                html += '<br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="'+inputId+'"></span>';
                break;
            default:
                this.err("unimplemented solution type '" + sym.type + "'")
        }
        html += '<span id="sell_input_feedback_' + this.instanceID + '_' + this.qidx + '_' + symId + '"></span>';
        if(this.debug)
            html += '<span class="text-warning">' + sym.toAsciiMath() + '</span>';

        this.parsingInlineCode = false;
        this.parseWhitespaces = true;

        return html;
    }

    evaluateUserInput(qidx) {
        const epsilon = 1e-9;

        let n;
        let q = this.questions[qidx];
        let containsSingleChoice = false;
        let selectedAnySingleChoiceOption = false;

        // --- multiple-choice preprocessing: check, if ALL answers are correct ---
        let allMultipleChoiceAnswersCorrect = true;
        for(let solutionSymbolId in q.solutionSymbols) {
            let solutionSymbol = q.solutionSymbols[solutionSymbolId];
            if(solutionSymbol.type == symtype.T_BOOL
                && solutionSymbolId.includes('_mc_')) {
                    let userSolution = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_INPUT).checked;
                    if (userSolution == (solutionSymbol.value == true)) { }
                    else allMultipleChoiceAnswersCorrect = false;
            }
        }

        // --- core ---
        for(let solutionSymbolId in q.solutionSymbols) {

            let solutionSymbol = q.solutionSymbols[solutionSymbolId];
            let userSolution, userSolutionElement;
            let userSolutionComplex, userSolutionReal, userSolutionImag;
            let ok = false;
            let feedback = this.getElementByIdAndType("sell_input_feedback_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_SPAN);
            let feedback_additional_text = '';
            let showFeedback = true;
            let matrixInput, m, n;

            if(allMultipleChoiceAnswersCorrect == false)
                showFeedback = false;

            switch(solutionSymbol.type) {

                case symtype.T_STRING_LIST:
                    userSolution = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_INPUT).value;
                    for(let i=0; i<solutionSymbol.value.length; i++) {
                        let sol_i = solutionSymbol.value[i];
                        let levDist = sellLevenShteinDistance(userSolution, sol_i);
                        levDist = math.abs(levDist);
                        ok = sol_i.length<=3 ? levDist==0 : levDist<=2;
                        if(sol_i.length>3 && levDist > 0 && levDist <= 2) {
                            feedback_additional_text = '<span class="text-warning">' + sol_i + '</span>';
                        } else
                            feedback_additional_text = '';
                        if(ok)
                            break;
                    }
                    break;

                case symtype.T_BOOL:
                    userSolution = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_INPUT).checked;
                    if (solutionSymbolId.includes('_sc_')) {
                        containsSingleChoice = true;
                        if (!userSolution) // for single choice (=: sc), give only feedback on user-selection
                            showFeedback = false;
                        if (userSolution)
                            selectedAnySingleChoiceOption = true;
                    }
                    if (userSolution == (solutionSymbol.value == true))
                        ok = true;
                    break;

                case symtype.T_REAL:
                    userSolution = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_INPUT).value;
                    userSolution = userSolution.replace(',', '.');
                    try {
                        userSolution = math.evaluate(userSolution);
                    } catch (e) {
                        switch (this.language) {
                            case "en": feedback_additional_text += 'Syntax error in "' + userSolution + '".&nbsp;&nbsp;'; break;
                            case "de": feedback_additional_text += 'Syntaxfehler in "' + userSolution + '".&nbsp;&nbsp;'; break;
                        }
                        userSolution = 0;
                    }
                    if (math.abs(solutionSymbol.value - userSolution) < solutionSymbol.precision)
                        ok = true;
                    solutionSymbol.user_value = userSolution; // TODO: must be done for all types!
                    break;
                
                case symtype.T_COMPLEX:
                    let elementReal = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId + '_real', this.ELEMENT_TYPE_INPUT);
                    let elementImag = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId + '_imag', this.ELEMENT_TYPE_INPUT);
                    userSolutionReal = elementReal.value;
                    userSolutionImag = elementImag.value;
                    // TODO: the following may not be allowed for all questions; must be configurable!!!!!
                    if (userSolutionReal.includes('sin') || userSolutionReal.includes('cos')) {
                        let msg = '';
                        switch (this.language) {
                            case "en": msg = 'sin(..) and cos(..) not allowed here!'; break;
                            case "de": msg = 'sin(..) und cos(..) sind nicht erlaubt!'; break;
                        }
                        feedback.innerHTML = '<span class="text-danger">&nbsp;&nbsp;' + msg + '</span>';
                        return;
                    }
                    if (userSolutionReal.length == 0) {
                        elementReal.value = '0';
                        userSolutionReal = 0;
                    }
                    if (userSolutionImag.length == 0) {
                        elementImag.value = '0';
                        userSolutionImag = 0;
                    }
                    try {
                        userSolutionReal = math.evaluate(userSolutionReal);
                    } catch (e) {
                        switch (this.language) {
                            case "en":
                                feedback_additional_text += 'Syntax error in "' + userSolutionReal + '".&nbsp;&nbsp;';
                                break;
                            case "de":
                                feedback_additional_text += 'Syntaxfehler in "' + userSolutionReal + '".&nbsp;&nbsp;';
                                break;
                        }
                        userSolutionReal = 0;
                    }
                    try {
                        userSolutionImag = math.evaluate(userSolutionImag);
                    } catch (e) {
                        switch (this.language) {
                            case "en":
                                feedback_additional_text += 'Syntax error in "' + userSolutionImag + '".&nbsp;&nbsp;';
                                break;
                            case "de":
                                feedback_additional_text += 'Syntaxfehler in "' + userSolutionImag + '".&nbsp;&nbsp;';
                                break;
                        }
                        userSolutionImag = 0;
                    }
                    userSolutionComplex = math.complex(parseFloat(userSolutionReal), parseFloat(userSolutionImag));
                    diff = math.abs(math.subtract(solutionSymbol.value, userSolutionComplex));
                    if (diff < epsilon)
                        ok = true;
                    break;
                
                case symtype.T_SET:
                case symtype.T_COMPLEX_SET:
                    userSolution = [];
                    n = solutionSymbol.value.length;
                    for (let k = 0; k < n; k++) {
                        let element = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId + '_' + k, this.ELEMENT_TYPE_INPUT);
                        let v = element.value;
                        v = v.replace('j', 'i');  // TODO: do this for all solution types!
                        v = v.replace(',', '.');  // TODO: do this for all solution types!
                        if (v.length == 0) {
                            element.value = '0';
                            v = '0';
                        }
                        try {
                            v = math.evaluate(v);
                        } catch (e) {
                            switch (sellLanguage) {
                                case "en": feedback_additional_text += 'Syntax error in "' + v + '".&nbsp;&nbsp;'; break;
                                case "de": feedback_additional_text += 'Syntaxfehler in "' + v + '".&nbsp;&nbsp;'; break;
                            }
                            v = '0';
                        }
                        userSolution.push(v);
                    }
                    let num_ok = 0;
                    for(let k=0; k<n; k++) {
                        let sol = solutionSymbol.value[k].value;
                        for (let l = 0; l < n; l++) {
                            let user_sol = userSolution[l];
                            let diff = math.abs(math.subtract(sol, user_sol));
                            if (diff < epsilon) {
                                num_ok++;
                                break;
                            }
                        }
                    }
                    if(num_ok < n) {
                        switch (this.language) {
                            case "en":
                                feedback_additional_text += num_ok + ' out of ' + n + ' answers are correct';
                                break;
                            case "de":
                                feedback_additional_text += num_ok + ' von ' + n + ' Antworten sind korrekt';
                                break;
                        }
                    }
                    else
                        ok = true;
                    break;

                case symtype.T_FUNCTION:
                    userSolutionElement = this.getElementByIdAndType("sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId, this.ELEMENT_TYPE_INPUT);
                    userSolution = userSolutionElement.value;
                    if(userSolution.length == 0)
                        userSolution = "11111111"; // do not set to "0", since this is often a valid solution
                    userSolution = userSolution.replace(',', '.');
                    
                    if(solutionSymbolId in q.solutionSymbolsMustDiffFirst) {
                        let userSymTerm = new Symbolic.SellSymTerm();
                        if(userSymTerm.importMathJsTerm(userSolution)) {
//console.log('user sol: ' + userSymTerm.toString());
                            let diffVar = q.solutionSymbolsMustDiffFirst[solutionSymbolId];
                            userSolution = userSymTerm.derivate(diffVar);
                            userSolution = userSolution.toString();
//console.log('user sol diff: ' + userSolution);
                            ok = solutionSymbol.value.compareWithStringTerm(userSolution);
                        } else
                            ok = false;
                    } else {
                        ok = solutionSymbol.value.compareWithStringTerm(userSolution);
                    }
                    if (!ok && solutionSymbol.value.state == "syntaxerror") {
                        switch (this.language) {
                            case "en":
                                feedback_additional_text += 'Syntax errors or invalid variables in "' + userSolution + '"';
                                break;
                            case "de":
                                feedback_additional_text += 'Syntaxfehler oder unzulässige Variablen in "' + userSolution + '"';
                                break;
                        }
                    }
                    solutionSymbol.user_value = userSolution;
                    break;
                
                case symtype.T_MATRIX:
                    matrixInput = null;
                    for (let k = 0; k < this.matrixInputs.length; k++) {
                        if (this.matrixInputs[k].id === "sell_input_" + this.instanceID + '_' + qidx + '_' + solutionSymbolId) {
                            matrixInput = this.matrixInputs[k];
                            break;
                        }
                    }
                    m = math.size(solutionSymbol.value).subset(math.index(0));
                    n = math.size(solutionSymbol.value).subset(math.index(1));
                    matrixInput.setUnsetElementsToZero();
                    if (matrixInput.m == m && matrixInput.n == n) {
                        ok = true;
                        // build user matrix
                        let mat_user = math.zeros(m, n);
                        for (let i = 0; i < m; i++) {
                            for (let j = 0; j < n; j++) {
                                let v_user_text = matrixInput.getElementText(i, j);
                                let v_user;
                                try {
                                    v_user = math.evaluate(v_user_text);
                                } catch (e) {
                                    switch (this.language) {
                                        case "en":
                                            feedback_additional_text += 'Syntax error in "' + v_user_text + '".&nbsp;&nbsp;';
                                            break;
                                        case "de":
                                            feedback_additional_text += 'Syntaxfehler in "' + v_user_text + '".&nbsp;&nbsp;';
                                            break;
                                    }
                                    v_user = 0;
                                    ok = false;
                                }
                                mat_user = mat_user.subset(math.index(i, j), v_user);
                            }
                        }
                        if (ok) {
                            /*TODO if (solution.scaling_allowed)
                                ok = LinAlg.SellLinAlg.matrices_numerical_equal_by_scaling_factor(solution.value, mat_user);
                            else*/
                            ok = LinAlg.SellLinAlg.mat_compare_numerically(solutionSymbol.value, mat_user);
                        }
                    } else {
                        switch (this.language) {
                            case "en":
                                feedback_additional_text += 'Dimensioned incorrectly!';
                                break;
                            case "de":
                                feedback_additional_text += 'Falsche Dimensionierung!';
                                break;
                        }
                    }
                    break;

                default:
                    assert(false, "evaluateUserInput: solution type '" + solutionSymbol.type + "' is unimplemented");
            }
            if(showFeedback) {
                if (ok) {
                    feedback.innerHTML = '&#x2705; &nbsp;&nbsp; ' + feedback_additional_text; // check mark
                } else {
                    feedback.innerHTML = '&#x274C; &nbsp;&nbsp; <span class="text-danger">' + feedback_additional_text + '</span>'; // cross mark
                    if(solutionSymbol.hint_html.length > 0) {
                        feedback.innerHTML += '  <span class="text-info">' + solutionSymbol.hint_html + '</span>';
                        setTimeout(function(){ MathJax.typeset(); }, 10);
                    }
                }
            } else {
                feedback.innerHTML = '';
            }
        }
        // ----- general feedback -----
        let generalFeedback = this.getElementByIdAndType("sell_input_feedback_" + this.instanceID + '_' + qidx + '_general_feedback', this.ELEMENT_TYPE_SPAN);
        if (containsSingleChoice && !selectedAnySingleChoiceOption) {
            switch (this.language) {
                case "en":
                    generalFeedback.innerHTML = '<span class="text-danger">No answer chosen!</span>';
                    break;
                case "de":
                    generalFeedback.innerHTML = '<span class="text-danger">Keine Antwort gewählt!</span>';
                    break;
            }
        } else if(!allMultipleChoiceAnswersCorrect) {
            switch (this.language) {
                case "en":
                    generalFeedback.innerHTML = '<span class="text-danger">Not yet correct. Try again!</span>';
                    break;
                case "de":
                    generalFeedback.innerHTML = '<span class="text-danger">Noch nicht korrekt. Nochmal versuchen!</span>';
                    break;
            }
        }
        else {
            generalFeedback.innerHTML = '';
        }
    }

} // end of class Sell

class SellToken {
    constructor(str, line, col) {
        this.str = str;
        this.line = line; // line number
        this.col = col; // column number
    }
} // end of class SellToken

class Lexer {
    static isAlpha(ch) {
        return (ch>='A' && ch<='Z') ||  (ch>='a' && ch<='z') || ch=='_' || ch=='Ä' || ch=='Ö' || ch=='Ü' || ch=='ß' || ch=='ä' || ch=='ö' || ch=='ü';
    }
    static isNum(ch) {
        return ch>='1' && ch<='9';
    }
    static isNum0(ch) {
        return ch=='0' || this.isNum(ch);
    }
    static isIdentifier(str) {
        for(let i=0; i<str.length; i++) {
            let ch = str[i];
            if(i==0) {
                if(this.isAlpha(ch)==false)
                    return false;
            } else {
                if(this.isAlpha(ch)==false && this.isNum0(ch)==false)
                    return false;
            }
        }
        return true;
    }
    // integer = [ "-"], num { num0 };
    static isInteger(str) {
        // TODO: e.g. "0123" must return false
        if(str.length == 0)
            return false;
        let startIdx = 0;
        if(str[0] === '-') {
            startIdx = 1;
            if(str.length == 1)
                return false;
        }
        for(let i=startIdx; i<str.length; i++) {
            let ch = str[i];
            if(this.isNum0(ch)==false)
                return false;
        }
        return true;
    }
    static isReal(str) {
        return isNaN(parseFloat(str)) == false;
    }
    static tokenize(s) {
        let tokens = new Array();
        let str = '';
        let str_col = 1;
        let lineIdx = 1;
        let colIdx = 1;
        
        let allowUnderscoredelimiter = !s.startsWith('\t') && !s.startsWith('    ');
        //let allowUnderscoredelimiter = false;

        for(let i=0; i<s.length; i++) {
            let ch = s[i];
            let ch2 = '';
            if(i<s.length-1)
                ch2 = s[i+1];
            let ch3 = '';
            if(i<s.length-2)
                ch3 = s[i+2];
            switch(ch) {

                case ' ':
                case '\t':
                case '\n':
                    if(str.length > 0)
                        tokens.push(new SellToken(str, lineIdx, str_col));
                    str = '';
                    str_col = colIdx;
                    if(ch === '\n') {
                        lineIdx ++;
                        colIdx = 0;
                    }
                    else if(ch === ' ') {
                        tokens.push(new SellToken(ch, lineIdx, str_col));
                    }
                    break;
                    
                case '_':
                    if(allowUnderscoredelimiter) {
                        if(str.length > 0)
                            tokens.push(new SellToken(str, lineIdx, str_col));
                        str = '';
                        str_col = colIdx;
                        if(ch=='_' && ch2=='_') { 
                            ch = "__"; i ++; 
                        }
                        tokens.push(new SellToken(ch, lineIdx, str_col));
                        str_col = colIdx;
                    } else {
                        if(str.length == 0)
                            str_col = colIdx;
                        str += ch;
                    }
                    break;

                case '(': case ')': case '{': case '}': case '[': case ']':
                case '+': case '-': case '*': case '/': case '^': case '~':
                case '#': case '.': case ',': case ';': case ':': case '=':
                case '@': case '|': case '$': case '?': case '!': case '"':
                case '<': case '>': case '`': case '\\': case '\'':
                    if(str.length > 0)
                        tokens.push(new SellToken(str, lineIdx, str_col));
                    str = '';
                    str_col = colIdx;
                    if(ch==':' && ch2=='=') { ch = ":="; i ++; }
                    else if(ch=='^' && ch2=='^') { ch = "^^"; i ++; }
                    else if(ch=='\\' && ch2=='\\') { ch = "\\\\"; i ++; }
                    else if(ch=='-' && ch2=='>') { ch = "->"; i ++; }
                    else if(ch=='|' && ch2=='-' && ch3=='>') { ch = "|->"; i += 2; }
                    else if(ch=='<' && ch2=='=') { ch = "<="; i ++; }
                    else if(ch=='>' && ch2=='=') { ch = ">="; i ++; }
                    else if(ch=='=' && ch2=='=') { ch = "=="; i ++; }
                    else if(ch=='!' && ch2=='=') { ch = "!="; i ++; }
                    else if(ch=='.' && ch2=='.' && ch3=='.') { ch = "..."; i += 2; }
                    else if(ch=='`' && ch2=='`' && ch3=='`') { ch = "```"; i += 2; }
                    tokens.push(new SellToken(ch, lineIdx, str_col));
                    str_col = colIdx;
                    break;

                default:
                    if(str.length == 0)
                        str_col = colIdx;
                    str += ch;
            }
            colIdx ++;
        }
        if(str.length > 0)
            tokens.push(new SellToken(str, lineIdx, str_col));
            

        //for(let i=0; i<tokens.length; i++) {
        //    console.log(tokens[i]);
        //}

        return tokens;
    }
    static printTokenList(tokens) {
        for(let i=0; i<tokens.length; i++) {
            let token = tokens[i];
            console.log(token.line + ':' + token.col + ':' + token.str);
        }
    }
    static randomInt(min, max) { // i in [min,max)
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }
    static splitStringAndKeepDelimiters(s, del) {
        let tokens = Array();
        let tk = '';
        for(let i=0; i<s.length; i++) {
            let match = true;
            let match_d = '';
            for(let j=0; j<del.length; j++) {
                let d = del[j];
                match = true;
                if((i + d.length) > s.length)
                    match = false;
                else {
                    for(let k=0; k<d.length; k++) {
                        if(s[i+k] != d[k]) {
                            match = false;
                            break;
                        }
                    }
                }
                if(match) {
                    match_d = d;
                    break;
                }
            }
            if(match) {
                if(tk.length > 0) {
                    tokens.push(tk);
                    tk = '';
                }
                tokens.push(match_d);
                i += match_d.length - 1;
            } else {
                tk += s[i];
            }
        }
        if(tk.length > 0)
            tokens.push(tk);
        return tokens;
    }
} // end of class Lexer

function resizeMatrixInput(sellInstanceID, matrixId, diffM, diffN) {
    alert("THIS IS OLD!!");
}

class SellMatrixInput {
    constructor(environment, sellInstanceID, id, m, n, wideInput=false, resizableRows=false, resizableCols=false) {
        this.environment = environment
        this.sellInstanceID = sellInstanceID;
        this.id = id;
        this.m = m;
        this.n = n;
        this.wideInput = wideInput;
        this.resizableRows = resizableRows;
        this.resizableCols = resizableCols;
    }
    getElementByIdAndType(id, type) { // TODO: duplicate to sell-class
        if(this.environment == "mumie") {
            // https://www.integral-learning.de/platform/
            let inputField;
            inputField = Array.from(document.getElementsByTagName(type))
                .filter((inputFields) => inputFields.id === id)
                .find((inputFields) => inputFields.offsetParent !== null);
            return inputField ? inputField : document.getElementById(id);
        } else {
            // standalone version
            return document.getElementById(id);
        }
    }
    resize(diffM, diffN) {
        // TODO: backup values
        this.m += diffM;
        this.n += diffN;
        this.m = this.m < 1 ? 1 : this.m;
        this.n = this.n < 1 ? 1 : this.n;
        this.updateHTML();
    }
    getElementText(i, j) {
        return this.getElementByIdAndType(this.sellInstanceID + '_' + this.id + '_' + i + '_' + j, this.ELEMENT_TYPE_INPUT).value;
    }
    setElementText(i, j, text) {
        this.getElementByIdAndType(this.sellInstanceID + '_' + this.id + '_' + i + '_' + j, this.ELEMENT_TYPE_INPUT).value = text;
    }
    setUnsetElementsToZero() {
        for(let i=0; i<this.m; i++) {
            for(let j=0; j<this.n; j++) {
                let v = this.getElementText(i, j);
                if(v.length == 0) {
                    this.setElementText(i, j, "0");
                }
            }
        }
    }
    updateHTML() {
        let elementWidth = this.wideInput ? 20 : 4;
        let s = '';
        s += '<span>\n';

        s += '<table class="p-0 m-0" style="display:inline-block;border-spacing:0;border-collapse:collapse;">\n';
        s += '    <tr>\n';
        s += '        <td>\n';
        s += '            <table style="border-spacing:0;border-collapse:collapse;border-left:2px solid black;border-right:2px solid black;">\n';
        for(let i=0; i<this.m; i++) {
            s += '                <tr>\n';
            if(i==0)
                s += '                    <td style="border-top:2px solid black;"></td>\n';
            else if(i==this.m-1)
                s += '                    <td style="border-bottom:2px solid black;"></td>\n';
            else
                s += '                    <td></td>\n';
            for(let j=0; j<this.n; j++) {
                s += '                    <td>\n';
                s += '            <input type="text" id="' + this.sellInstanceID + '_' + this.id + '_' + i + '_' + j + '" size="' + elementWidth + '" placeholder=""/>\n';
                s += '                    </td>\n';
            }
            if(i==0)
                s += '                    <td style="border-top:2px solid black;"></td>\n';
            else if(i==this.m-1)
                s += '                    <td style="border-bottom:2px solid black;"></td>\n';
            else
                s += '<td></td>\n';
            s += '                </tr>\n';
        }
        s += '            </table>\n';
        s += '        </td>\n';
        if(this.resizableCols) {
            s += '        <td style="text-align:left">\n';
            s += '            <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="' + this.sellInstanceID + '.resizeMatrixInput(' + "'" + this.id + "'" + ',0,1);">&nbsp;&#8853;</button>\n';
            s += '            <br/>\n';
            s += '            <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="' + this.sellInstanceID + '.resizeMatrixInput(' + "'" + this.id + "'" + ',0,-1);">&nbsp;&#8854;</button>\n';
            s += '        </td>\n';
        }
        s += '    </tr>\n';
        s += '    <tr>\n';
        if(this.resizableRows) {
            s += '    <td style="text-align:center">\n';
            s += '        <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="' + this.sellInstanceID + '.resizeMatrixInput(' + "'" + this.id + "'" + ',1,0);">&#8853;</button>\n';
            s += '        &nbsp;\n';
            s += '        <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="' + this.sellInstanceID + '.resizeMatrixInput(' + "'" + this.id + "'" + ',-1,0);">&#8854;</button>\n';
            s += '    </td>\n';
        }
        s += '        <td></td>\n';
        s += '    </tr>\n';
        s += '</table>\n';

        s += '</span>\n';
        this.getElementByIdAndType(this.id, this.ELEMENT_TYPE_SPAN).innerHTML = s;
    }
}

function sellLevenShteinDistance(str1 = '', str2 = '') {
    // 'code' taken from: https://www.tutorialspoint.com/levenshtein-distance-in-javascript
    // TODO: copyright?????
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator, // substitution
            );
        }
    }
    return track[str2.length][str1.length];
}

export { Sell };
