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
import { ParseIM_Input } from './parse-im-input.js';
import { ParseProg } from './parse-prog.js';
import { Evaluate } from './evaluate.js';
import { getHtmlChildElementRecursive } from './help.js';
//import { check_symbol_svg } from './img.js'
import { sellassert } from './sellassert.js';
import { GET_STR } from './lang.js';
export var SellInputElementType;
(function (SellInputElementType) {
    SellInputElementType["UNKNOWN"] = "unknown";
    SellInputElementType["TEXTFIELD"] = "textfield";
    SellInputElementType["COMPLEX_NUMBER"] = "complex_number";
    SellInputElementType["CHECKBOX"] = "checkbox";
    SellInputElementType["VECTOR"] = "vector";
    SellInputElementType["MATRIX"] = "matrix";
    SellInputElementType["JAVA_PROGRAMMING"] = "java_programming";
})(SellInputElementType || (SellInputElementType = {}));
export class SellInput {
    constructor() {
        this.htmlElementId = "";
        this.htmlElementInputType = SellInputElementType.UNKNOWN;
        this.htmlElementId_feedback = "";
        this.solutionVariableId = "";
        this.solutionVariableRef = null;
        //solutionVariableMathtype: symtype = symtype.T_UNKNOWN;
        // linearized input: one element for scalars, n elemens for vectors, m*n elements for matrices (row-major)
        this.studentAnswer = [];
        this.evaluationFeedbackStr = "";
        this.correct = false;
        // only used for matrix based mathtypes
        this.matrixInput = null;
        // only used for vector based mathtypes
        this.vectorLength = 1;
        // evaluation of e.g. programming tasks is done asynchronesouly.
        // As long as the evaluation is ongoing, evaluationInProgress is set true.
        this.evaluationInProgress = false;
        this.codeMirror = null; // IDE instance; only used for programming tasks
    }
}
export class SellQuestion {
    constructor() {
        this.idx = 0;
        this.src = '';
        this.html = '';
        this.titleHtml = '';
        this.bodyHtml = '';
        this.bodyHtmlElement = null;
        this.symbols = {};
        this.solutionSymbols = {};
        this.solutionSymbolsMustDiffFirst = {};
        this.lastParsedInputSymbol = null;
        this.stack = [];
        this.inputs = [];
        this.generalFeedbackStr = "";
        this.allAnswersCorrect = false;
        // TODO: move parse method and other methods here
    }
}
export class SellQuiz {
    constructor(debug = false) {
        // subclases
        this.evaluate = null;
        this.textParser = null;
        this.codeParser = null;
        this.codeSymParser = null;
        this.imParser = null;
        this.imInputParser = null;
        this.progParser = null;
        this.ELEMENT_TYPE_INPUT = 'input';
        this.ELEMENT_TYPE_SPAN = 'span';
        // preferences
        this.debug = false;
        this.log = '';
        this.language = 'en';
        this.generateInputFieldHtmlCode = true;
        this.servicePath = './services/';
        // questions
        this.questions = [];
        this.q = null; // current question
        this.qidx = 0; // current question index
        this.html = '';
        this.variablesJsonStr = ''; // TODO!!
        // lexer (remark: if attributes are changed, then methods backupLexer,
        //        and replayLexer must also be changed)
        this.tokens = [];
        this.tk = '';
        this.tk2 = '';
        this.tk_line = 0;
        this.tk_col = 0;
        this.tkIdx = 0;
        this.id = '';
        // parsing states
        this.parseWhitespaces = false;
        this.parsingInlineCode = false; // true while parsing solution code after '#'
        // style states
        this.isBoldFont = false;
        this.isItalicFont = false;
        this.isItemize = false;
        this.isItemizeItem = false;
        this.singleMultipleChoiceFeedbackHTML = ''; // written at end of line
        // matrix inputs
        //matrixInputs: Array<SellMatrixInput> = [];
        this.resizableRows = false;
        this.resizableCols = false;
        // unique id counter
        this.uniqueIDCtr = 0;
        this.editButton = false;
        // instantiate evaluation class
        this.evaluate = new Evaluate(this);
        // instantiate parser classes
        this.textParser = new ParseText(this);
        this.codeParser = new ParseCode(this);
        this.codeSymParser = new ParseCodeSym(this);
        this.imParser = new ParseIM(this);
        this.imInputParser = new ParseIM_Input(this);
        this.progParser = new ParseProg(this);
    }
    // TODO:
    createIDE(sellInput, htmlElement, lang = "Java", height = 75) {
        // dev info: the CodeMirror editor is not included here directly for two reasons:
        //  (a.) many users will use SELL without programming questions
        //  (b.) CodeMirror can not be used in combination with node.js (DOM-environment not present)
        console.log("ERROR: Obviously your quiz includes a programming task. Please also include sellquiz.ide.min.js in your HTML file");
    }
    importQuestions(sellCode) {
        sellCode = sellCode.split('STOP')[0];
        let sellCodeLines = sellCode.split("\n");
        let code = '';
        let codeStartRow = 0;
        for (let i = 0; i < sellCodeLines.length; i++) {
            let line = sellCodeLines[i];
            if (line.startsWith("%%%")) {
                if (!this.importQuestion(code, codeStartRow))
                    return false;
                code = '';
                codeStartRow = i + 1;
            }
            else {
                code += line + '\n';
            }
        }
        if (!this.importQuestion(code, codeStartRow))
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
    importQuestion(src, codeStartRow = 0) {
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
        //let indent1_last = false;
        //let indent2_last = false;
        let last_indent = 0;
        let code_block = false; // inline code (NOT to be confused with SELL-code)
        for (let i = 0; i < lines.length; i++) {
            if (!code_block && lines[i].startsWith('```'))
                code_block = true;
            //let indent2 = lines[i].startsWith('\t\t') || lines[i].startsWith('        ');
            //let indent1 = lines[i].startsWith('\t') || lines[i].startsWith('    ');
            //if (indent2)
            //    indent1 = false;
            let indent = 0;
            if (lines[i].startsWith('\t\t') || lines[i].startsWith('        '))
                indent = 2;
            else if (lines[i].startsWith('\t') || lines[i].startsWith('    '))
                indent = 1;
            let line_str = lines[i].split('%')[0]; // remove comments
            if (line_str.length == 0) // empty line
                continue;
            let lineTokens = Lexer.tokenize(line_str);
            if (lineTokens.length == 0)
                continue;
            lineTokens.push(new SellToken('§EOL', i + 1, -1)); // end of line
            if (!code_block) {
                /*if (!indent1 && indent1_last)
                    this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
                if (indent1 && !indent1_last)
                    this.tokens.push(new SellToken('§CODE_START', i + 1, -1));*/
                if (last_indent == 0 && indent == 1)
                    this.tokens.push(new SellToken('§CODE_START', i + 1, -1));
                else if (last_indent == 0 && indent == 2) {
                    this.tokens.push(new SellToken('§CODE_START', i + 1, -1));
                    this.tokens.push(new SellToken('§CODE2_START', i + 1, -1));
                }
                else if (last_indent == 1 && indent == 2)
                    this.tokens.push(new SellToken('§CODE2_START', i + 1, -1));
                else if (last_indent == 2 && indent == 1)
                    this.tokens.push(new SellToken('§CODE2_END', i + 1, -1));
                else if (last_indent == 2 && indent == 0) {
                    this.tokens.push(new SellToken('§CODE2_END', i + 1, -1));
                    this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
                }
                else if (last_indent == 1 && indent == 0)
                    this.tokens.push(new SellToken('§CODE_END', i + 1, -1));
            }
            for (let j = 0; j < lineTokens.length; j++) {
                this.tokens.push(lineTokens[j]);
                this.tokens[this.tokens.length - 1].line = codeStartRow + i + 1;
            }
            //indent1_last = indent1;
            //indent2_last = indent2;
            last_indent = indent;
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
        }
        catch (e) {
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
            }
            else
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
    backupQuestion(questionID) {
        let q = this.getQuestionByIdx(questionID);
        if (q == null)
            return null;
        let backup = {};
        // source and generated HTML
        backup["source_code"] = q.src;
        backup["title_html"] = q.titleHtml;
        backup["body_html"] = q.bodyHtml;
        // variables
        backup["variables"] = [];
        for (let symid in q.symbols)
            backup["variables"].push(q.symbols[symid].exportDictionary(symid));
        backup["solution_variables"] = [];
        for (let symid in q.solutionSymbols)
            backup["solution_variables"].push(q.solutionSymbols[symid].exportDictionary(symid));
        // TODO: mustDiffFrist, ....
        // input fields
        backup["input_fields"] = [];
        for (let i = 0; i < q.inputs.length; i++) {
            let input = q.inputs[i];
            let f = {};
            f["element_type"] = input.htmlElementInputType;
            f["element_id"] = input.htmlElementId;
            f["element_id__feedback"] = input.htmlElementId_feedback;
            f["correct"] = input.correct;
            f["feedback_message"] = input.evaluationFeedbackStr;
            f["student_answer_string"] = input.studentAnswer;
            f["solution_variable_id"] = input.solutionVariableId;
            backup["input_fields"].push(f);
        }
        // global evaluation feedback
        backup["general_feedback"] = {};
        backup["general_feedback"]["all_answers_correct"] = q.allAnswersCorrect;
        backup["general_feedback"]["feedback_message"] = q.generalFeedbackStr;
        // stringify
        return JSON.stringify(backup, null, 4);
    }
    getQuestionInputFields(questionID) {
        let inputFields = [];
        let backupStr = this.backupQuestion(questionID);
        let backup = JSON.parse(backupStr);
        for (let i = 0; i < backup["input_fields"].length; i++) {
            inputFields.push({
                "element_id": backup["input_fields"][i]["element_id"],
                "element_type": backup["input_fields"][i]["element_type"],
                "solution_variable_id": backup["input_fields"][i]["solution_variable_id"]
            });
        }
        return inputFields;
    }
    createQuestionFromBackup(backupStr) {
        let backup = JSON.parse(backupStr);
        // TODO: check, if backup string is consistent
        let q = new SellQuestion();
        q.idx = this.questions.length;
        // source and generated HTML
        q.src = backup["source_code"];
        q.titleHtml = backup["title_html"];
        q.bodyHtml = backup["body_html"];
        // variables
        q.symbols = {};
        for (let i = 0; i < backup["variables"].length; i++) {
            let v = backup["variables"][i];
            let sym = new SellSymbol();
            sym.importDictionary(v);
            q.symbols[v["id"]] = sym;
        }
        q.solutionSymbols = {};
        for (let i = 0; i < backup["solution_variables"].length; i++) {
            let v = backup["solution_variables"][i];
            let sym = new SellSymbol();
            sym.importDictionary(v);
            q.solutionSymbols[v["id"]] = sym;
        }
        // input fields
        q.inputs = [];
        for (let i = 0; i < backup["input_fields"].length; i++) {
            let input = new SellInput();
            let f = backup["input_fields"][i];
            input.htmlElementInputType = f["element_type"];
            input.htmlElementId = f["element_id"];
            input.htmlElementId_feedback = f["element_id__feedback"];
            input.correct = f["correct"];
            input.evaluationFeedbackStr = f["feedback_message"];
            input.studentAnswer = f["student_answer_string"];
            input.solutionVariableId = f["solution_variable_id"];
            q.inputs.push(input);
        }
        // global evaluation feedback
        q.allAnswersCorrect = backup["general_feedback"]["all_answers_correct"];
        q.generalFeedbackStr = backup["general_feedback"]["feedback_message"];
        // push question and return index
        this.questions.push(q);
        return q.idx;
    }
    getElementByIdAndType(id, type) {
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
    backupLexer() {
        return {
            'tk': this.tk,
            'tk_line': this.tk_line,
            'tk_col': this.tk_col,
            'tk2': this.tk2,
            'tkIdx': this.tkIdx,
            'id': this.id
        };
    }
    replayLexer(lexState) {
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
    updateMatrixInputs(questionID) {
        let q = this.getQuestionByIdx(questionID);
        if (q == null)
            return false;
        for (let i = 0; i < q.inputs.length; i++) {
            let input = q.inputs[i];
            if (input.matrixInput != null) // TODO: better compare input.htmlElementInputType??
                input.matrixInput.updateHTML();
        }
        return true;
    }
    createProgrammingTaskEditors(questionID) {
        let q = this.getQuestionByIdx(questionID);
        if (q == null)
            return false;
        for (let i = 0; i < q.inputs.length; i++) {
            let input = q.inputs[i];
            if (input.htmlElementInputType == SellInputElementType.JAVA_PROGRAMMING) {
                let textarea = getHtmlChildElementRecursive(q.bodyHtmlElement, input.htmlElementId);
                this.createIDE(input, textarea, 'java', 150); // TODO: make height adjustable
            }
        }
        return true;
    }
    updateMatrixDims(questionID, htmlElementId, deltaRows, deltaCols) {
        let q = this.getQuestionByIdx(questionID);
        if (q == null)
            return false;
        for (let i = 0; i < q.inputs.length; i++) {
            let input = q.inputs[i];
            if (input.matrixInput != null && input.htmlElementId == htmlElementId)
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
        else {
            if (t == "§EOL")
                this.err("expected linebreak, got '" + this.tk + "'");
            else
                this.err("expected '" + t + "', got '" + this.tk.replace('§EOL', 'linebreak') + "'");
        }
    }
    ident() {
        if (this.isIdent()) {
            this.id = this.tk;
            this.next();
        }
        else
            this.err("expected identifier");
    }
    isIdent() {
        return Lexer.isIdentifier(this.tk);
    }
    isNumber() {
        return !isNaN(this.tk);
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
        this.q.html = '<div id="sell_question_html_element_' + this.q.idx + '" class="card border-dark">\n';
        this.q.html += '<div class="card-body px-3 py-2">\n'; // ** begin body        
        this.q.html += '    <span class="h2 py-1 my-1">' + this.q.titleHtml + '</span><br/>\n';
        this.q.html += '    <a name="question-' + (this.questions.length - 1) + '"></a>\n';
        this.q.html += '<div class="py-1">';
        this.q.html += this.q.bodyHtml;
        this.q.html += '</div>';
        this.q.html += '<span>';
        // submit button
        //this.q.html += '<input type="image" id="button-evaluate" onclick="sellquiz.autoEvaluateQuiz(' + this.qidx + ', \'sell_question_html_element_' + this.q.idx + '\');" height="28px" src=\"' + check_symbol_svg + '\" title="evaluate"></input>';
        let evalStr = GET_STR('evaluate', this.language, false);
        this.q.html += '<button type="button" class="btn btn-primary" onclick="sellquiz.autoEvaluateQuiz(' + this.qidx + ', \'sell_question_html_element_' + this.q.idx + '\');">' + evalStr + '</button>';
        // edit button
        if (this.editButton) {
            this.q.html += '&nbsp;<button type="button" class="btn btn-primary" onclick="editSellQuestion(' + this.qidx + ')">Edit</button>';
        }
        // general feedback
        this.q.html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="general_feedback"></span>';
        // end
        this.q.html += '</span>';
        this.q.html += '</div>\n'; // ** end body (begins in keyword 'TITLE')
        this.q.html += '</div>\n'; // *** end of card
        this.q.html += '<br/>';
    }
    getQuestionByIdx(idx) {
        if (idx < 0 || idx >= this.questions.length)
            return null;
        return this.questions[idx];
    }
    enableInputFields(questionID, enable = true) {
        let q = this.getQuestionByIdx(questionID);
        if (q == null)
            return false;
        if (q.bodyHtmlElement == null)
            sellassert(false, "enableInputFields(): q.bodyHtmlElement was not set");
        for (let i = 0; i < q.inputs.length; i++) {
            let element = getHtmlChildElementRecursive(q.bodyHtmlElement, q.inputs[i].htmlElementId);
            element.disabled = !enable;
        }
        return true;
    }
} // end of class Sell
//# sourceMappingURL=quiz.js.map