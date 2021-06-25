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

import { SellInput, SellQuestion } from './quiz.js';
import { getHtmlChildElementRecursive } from './help.js';
import { sellassert } from './sellassert.js';

export class MatrixInput {

    question : SellQuestion = null;
    input : SellInput = null;
    m : number = 2;
    n : number = 2;
    wideInput : boolean = false;
    resizableRows : boolean = false;
    resizableCols : boolean = false;

    ELEMENT_TYPE_INPUT : string = 'input';  // TODO: MUST BE DEFINED AT ONE SINGLE LOCATION and NOT here!!
    ELEMENT_TYPE_SPAN : string = 'span';

    constructor(question : SellQuestion, input : SellInput, m : number, n : number, 
                wideInput=false, resizableRows=false, resizableCols=false) {
        this.question = question;
        this.input = input;
        this.m = m;
        this.n = n;
        this.wideInput = wideInput;
        this.resizableRows = resizableRows;
        this.resizableCols = resizableCols;
    }

    resize(diffM : number, diffN : number) {
        let oldM = this.m;
        let oldN = this.n;
        let oldValues = this.getStudentAnswer();
        this.m += diffM;
        this.n += diffN;
        this.m = this.m < 1 ? 1 : this.m;
        this.n = this.n < 1 ? 1 : this.n;
        this.updateHTML();
        for(let i=0; i<this.m; i++) {
            for(let j=0; j<this.n; j++) {
                if(i < oldM && j < oldN)
                    this.setElementText(i, j, oldValues[i*oldN+j]);
            }
        }
    }

    getElementText(i : number, j : number) : string {
        let id = this.input.htmlElementId + '_' + i + '_' + j; // TODO: MUMIE!!
        let element = getHtmlChildElementRecursive(this.question.bodyHtmlElement, id);
        return (<HTMLInputElement>element).value;
    }

    setElementText(i : number, j : number, text : string) {
        let id = this.input.htmlElementId + '_' + i + '_' + j; // TODO: MUMIE!!
        let element = getHtmlChildElementRecursive(this.question.bodyHtmlElement, id);
        (<HTMLInputElement>element).value = text;
    }

    getStudentAnswer() : Array<string> {
        let s = [];
        for(let i=0; i<this.m; i++) {
            for(let j=0; j<this.n; j++) {
                let sij = this.getElementText(i, j);
                s.push(sij);
            }
        }
        return s;
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
                let id = this.input.htmlElementId + '_' + i + '_' + j;
                s += '                    <td>\n';
                s += '            <input type="text" id="' + id + '" size="' + elementWidth + '" placeholder=""/>\n';
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
            s += '            <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="sellquiz.refreshMatrixDimensions(' + this.question.idx + ', \'' + this.input.htmlElementId + '\', 0, 1);">&nbsp;&#8853;</button>\n';
            s += '            <br/>\n';
            s += '            <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="sellquiz.refreshMatrixDimensions(' + this.question.idx + ', \'' + this.input.htmlElementId + '\', 0, -1);">&nbsp;&#8854;</button>\n';
            s += '        </td>\n';
        }
        s += '    </tr>\n';
        s += '    <tr>\n';
        if(this.resizableRows) {
            s += '    <td style="text-align:center">\n';
            s += '        <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="sellquiz.refreshMatrixDimensions(' + this.question.idx + ', \'' + this.input.htmlElementId + '\', 1, 0);">&#8853;</button>\n';
            s += '        &nbsp;\n';
            s += '        <button class="matrix_size_button" style="font-size:18px;padding:0;border:none;background:none;" onclick="sellquiz.refreshMatrixDimensions(' + this.question.idx + ', \'' + this.input.htmlElementId + '\', -1, 0);">&#8854;</button>\n';
            s += '    </td>\n';
        }
        s += '        <td></td>\n';
        s += '    </tr>\n';
        s += '</table>\n';

        s += '</span>\n';

        let element = getHtmlChildElementRecursive(this.question.bodyHtmlElement, this.input.htmlElementId);
        sellassert(element != null, "MatrixInput.updateHTML(): question body HTML element is not set.");
        element.innerHTML = s;

        //TODO: MUMIE !!! this.getElementByIdAndType(this.id, this.ELEMENT_TYPE_SPAN).innerHTML = s;
    }

}
