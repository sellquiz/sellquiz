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
import { SellInput, SellInputElementType } from './quiz.js';
import { Lexer } from './lex.js';
import { symtype, SellSymbol } from './symbol.js';
export class ParseText {
    constructor(parent) {
        this.p = parent;
    }
    // title = 
    //   { ID | "#" ID | MISC } "\n";
    parseTitle() {
        this.p.parseWhitespaces = true;
        let title = '';
        while (!this.p.is('§EOL') && !this.p.is('§END')) {
            if (this.p.isIdent()) {
                title += this.p.tk;
                this.p.next();
            }
            else if (this.p.is('#')) {
                this.p.next();
                if (this.p.isIdent()) {
                    let tag = this.p.tk; // TODO: yet unused
                    this.p.next();
                }
                else
                    this.p.err("expected identifer after '#'");
            }
            else {
                title += this.p.charToHTML(this.p.tk);
                this.p.next();
            }
        }
        this.p.terminal('§EOL');
        this.p.parseWhitespaces = false;
        this.p.q.titleHtml = title;
    }
    endItemizeIfApplicable() {
        if (this.p.isItemizeItem)
            this.p.q.html += '</li>';
        if (this.p.isItemize)
            this.p.q.html += '</ul>';
        this.p.isItemizeItem = false;
        this.p.isItemize = false;
    }
    // text = 
    //   { single_multiple_choice | itemize | inline_listing | listing
    //     | inline_math | im_input | ID | MISC };
    parseText(parsingHint = false) {
        this.p.parseWhitespaces = true;
        while (!this.p.is('§END') && !this.p.is('§CODE_START')) {
            if (parsingHint && this.p.is("§EOL"))
                break;
            // end itemize, if applicable
            if (this.p.tk_col == 1 && !this.p.is('*'))
                this.endItemizeIfApplicable();
            // parse
            if (this.p.is('§EOL') && this.p.singleMultipleChoiceFeedbackHTML.length > 0) {
                this.p.q.html += '&nbsp;&nbsp;' + this.p.singleMultipleChoiceFeedbackHTML;
                this.p.singleMultipleChoiceFeedbackHTML = '';
                this.p.q.html += ']§'; // end of single-multiple choice
            }
            if (this.p.is('§EOL') && this.p.isItemizeItem) {
                this.p.next();
                this.p.q.html += '</li>';
                this.p.isItemizeItem = false;
            }
            else if (this.p.tk_col == 1 && this.p.is("["))
                this.parseSingleMultipleChoice(false /*multiple choice*/);
            else if (this.p.tk_col == 1 && this.p.is("("))
                this.parseSingleMultipleChoice(true /*single choice*/);
            else if (this.p.tk_col == 1 && this.p.is('*'))
                this.parseItemize();
            else if (this.p.is('`'))
                this.p.q.html += this.parseInlineListing();
            else if (this.p.is('```'))
                this.p.q.html += this.parseListing();
            else if (this.p.is('$'))
                this.p.imParser.parseInlineMath();
            else if (this.p.is('#'))
                this.p.q.html += this.p.imInputParser.parseIM_Input();
            else if (this.p.isIdent()) {
                // "__"/"_" are used to stard and end bold/italic font.
                // Tokens include underscores in general for most part of SELL, especially the code part.
                // Splitting is done here for text.
                let tokens = Lexer.splitStringAndKeepDelimiters(this.p.tk, ["__", "_"]);
                this.p.next();
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i] === '_') {
                        this.p.isItalicFont = !this.p.isItalicFont;
                        this.p.q.html += this.p.isItalicFont ? '<i>' : '</i>';
                    }
                    else if (tokens[i] === '__') {
                        this.p.isBoldFont = !this.p.isBoldFont;
                        this.p.q.html += this.p.isBoldFont ? '<b>' : '</b>';
                    }
                    else
                        this.p.q.html += tokens[i];
                }
            }
            else {
                this.p.q.html += this.p.charToHTML(this.p.tk);
                this.p.next();
            }
        }
        this.p.parseWhitespaces = false;
        this.endItemizeIfApplicable();
    }
    // itemize =
    //   "*";
    parseItemize() {
        this.p.terminal('*');
        if (this.p.isItemize == false) {
            this.p.q.html += '<ul>';
        }
        this.p.isItemize = true;
        this.p.isItemizeItem = true;
        this.p.q.html += '<li>';
    }
    // single_multiple_choice =
    //     "(" ("x"|expr) ")"
    //   | "[" ("x"|expr) "]";
    parseSingleMultipleChoice(isSingleChoice) {
        this.p.parseWhitespaces = false;
        let correct = false;
        if (isSingleChoice)
            this.p.terminal("(");
        else
            this.p.terminal("[");
        if (this.p.is("x")) {
            this.p.next();
            correct = true;
        }
        else if (!this.p.is("]") && !this.p.is(")") && !this.p.is(' ')) {
            this.p.codeParser.parseExpr();
            let v = this.p.q.stack.pop();
            if (v.type != symtype.T_BOOL)
                this.p.err("expression must be boolean");
            correct = v.value;
        }
        if (isSingleChoice)
            this.p.terminal(")");
        else
            this.p.terminal("]");
        this.p.parseWhitespaces = true;
        let prefix = isSingleChoice ? "_sc_" : "_mc_";
        let sym = new SellSymbol(symtype.T_BOOL, correct);
        let symId = prefix + this.p.createUniqueID();
        this.p.q.symbols[symId] = sym;
        this.p.q.solutionSymbols[symId] = sym;
        let input = new SellInput();
        input.htmlElementId = "sellquiz_input_" + symId;
        input.solutionVariableId = symId;
        input.htmlElementId_feedback = "sellquiz_feedback_" + symId;
        input.htmlElementInputType = SellInputElementType.CHECKBOX;
        this.p.q.inputs.push(input);
        let inputType = isSingleChoice ? "radio" : "checkbox";
        let checked = "";
        this.p.q.html += '\n§[';
        this.p.q.html += '<input id="' + input.htmlElementId + '" type="' + inputType + '" name="sell_input" ' + checked + '/>&nbsp;';
        this.p.singleMultipleChoiceFeedbackHTML = '&nbsp;<span id="' + input.htmlElementId_feedback + '"></span>\n';
    }
    // inline_listing =
    //   "`" { MISC } "`";
    parseInlineListing() {
        let html = '';
        this.p.terminal('`');
        html += '<code class="text-primary">';
        while (!this.p.is('`') && !this.p.is('§END')) {
            html += this.p.tk;
            this.p.next();
        }
        this.p.terminal('`');
        html += '</code>';
        return html;
    }
    // listing =
    //   "```" { MISC } "```";
    parseListing() {
        let code = '';
        this.p.terminal('```');
        while (!this.p.is('```') && !this.p.is('§END')) {
            if (this.p.is("§EOL")) {
                code += '\n';
                this.p.next();
                while (this.p.is(" ")) {
                    code += '&nbsp;';
                    this.p.next();
                }
            }
            else if (this.p.is("\t")) {
                code += '&nbsp;&nbsp;&nbsp;&nbsp;';
                this.p.next();
            }
            else {
                code += this.p.tk;
                this.p.next();
            }
        }
        code = code.replaceAll('<', '&lt;');
        code = code.replaceAll('>', '&gt;');
        code = code.replaceAll('\n', '<br/>');
        this.p.terminal('```');
        let html = '';
        html += '<hr class="mt-2 mb-0"/>';
        html += '<code class="text-primary">';
        html += code;
        html += '</code>';
        html += '<hr class="mt-0 mb-0"/>';
        return html;
    }
}
//# sourceMappingURL=parse-text.js.map