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

export class SellMatrixInput {
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
