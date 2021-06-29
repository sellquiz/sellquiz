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

export class SellToken {
    str : string;
    line : number;
    col : number;
    constructor(str : string, line : number, col : number) {
        this.str = str;
        this.line = line; // line number
        this.col = col; // column number
    }
} // end of class SellToken

export class Lexer {

    static isAlpha(ch : string) {
        return (ch>='A' && ch<='Z') ||  (ch>='a' && ch<='z') || ch=='_' || ch=='Ä' || ch=='Ö' || ch=='Ü' || ch=='ß' || ch=='ä' || ch=='ö' || ch=='ü';
    }

    static isNum(ch : string) {
        return ch>='1' && ch<='9';
    }

    static isNum0(ch : string) {
        return ch=='0' || this.isNum(ch);
    }

    static isIdentifier(str : string) {
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
    static isInteger(str : string) {
        // TODO: e.g. "0123" must return false    TODO: parseUnary  uses this function including leading zeros...
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

    static isReal(str : string) {
        return isNaN(parseFloat(str)) == false;
    }

    static tokenize(s : string) {
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
    static printTokenList(tokens : Array<SellToken>) {
        for(let i=0; i<tokens.length; i++) {
            let token = tokens[i];
            console.log(token.line + ':' + token.col + ':' + token.str);
        }
    }

    static randomInt(min : number, max : number) { // i in [min,max)
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
