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

import { SellSymbol } from './symbol.js';
import { SellToken, Lexer } from './lex.js';
import { ParseText } from './parse-text.js';
import { ParseCode } from './parse-code.js';
import { ParseCodeSym } from './parse-code-sym.js';
import { ParseIM } from './parse-im.js';
import { Evaluate } from './evaluate.js';
import { sellassert } from './sellassert.js';

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

        this.textParser = new ParseText(this);
        this.codeParser = new ParseCode(this);
        this.codeSymParser = new ParseCodeSym(this);
        this.imParser = new ParseIM(this);

        this.ELEMENT_TYPE_INPUT = 'input';
        this.ELEMENT_TYPE_SPAN = 'span';
        //
        this.debug = debug;
        this.log = '';
        this.language = language;
        this.instanceID = instanceID;
        this.environment = environment;
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

    isNumberInt(v) {
        return Math.abs(v - Math.round(v)) < 1e-6;
    }

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
        this.textParser.parseTitle();
        while(!this.is('§END')) {
            if(this.is("§CODE_START"))
                this.codeParser.parseCode();
            else
                this.textParser.parseText();
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

} // end of class Sell

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
