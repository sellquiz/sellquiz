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

import { sellassert } from './sellassert.js';

export class Evaluate {

    constructor(parent) {
        this.p = parent;
    }

    evaluateUserInput(qidx) {
        const epsilon = 1e-9;

        let n;
        let q = this.p.questions[qidx];
        let containsSingleChoice = false;
        let selectedAnySingleChoiceOption = false;

        // --- multiple-choice preprocessing: check, if ALL answers are correct ---
        let allMultipleChoiceAnswersCorrect = true;
        for(let solutionSymbolId in q.solutionSymbols) {
            let solutionSymbol = q.solutionSymbols[solutionSymbolId];
            if(solutionSymbol.type == symtype.T_BOOL
                && solutionSymbolId.includes('_mc_')) {
                    let userSolution = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_INPUT).checked;
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
            let feedback = this.p.getElementByIdAndType("sell_input_feedback_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_SPAN);
            let feedback_additional_text = '';
            let showFeedback = true;
            let matrixInput, m, n;

            if(allMultipleChoiceAnswersCorrect == false)
                showFeedback = false;

            switch(solutionSymbol.type) {

                case symtype.T_STRING_LIST:
                    userSolution = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_INPUT).value;
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
                    userSolution = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_INPUT).checked;
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
                    userSolution = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_INPUT).value;
                    userSolution = userSolution.replace(',', '.');
                    try {
                        userSolution = math.evaluate(userSolution);
                    } catch (e) {
                        switch (this.p.language) {
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
                    let elementReal = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId + '_real', this.p.ELEMENT_TYPE_INPUT);
                    let elementImag = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId + '_imag', this.p.ELEMENT_TYPE_INPUT);
                    userSolutionReal = elementReal.value;
                    userSolutionImag = elementImag.value;
                    // TODO: the following may not be allowed for all questions; must be configurable!!!!!
                    if (userSolutionReal.includes('sin') || userSolutionReal.includes('cos')) {
                        let msg = '';
                        switch (this.p.language) {
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
                        switch (this.p.language) {
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
                        switch (this.p.language) {
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
                        let element = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId + '_' + k, this.p.ELEMENT_TYPE_INPUT);
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
                        switch (this.p.language) {
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
                    userSolutionElement = this.p.getElementByIdAndType("sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId, this.p.ELEMENT_TYPE_INPUT);
                    userSolution = userSolutionElement.value;
                    if(userSolution.length == 0)
                        userSolution = "11111111"; // do not set to "0", since this is often a valid solution
                    userSolution = userSolution.replace(',', '.');
                    
                    if(solutionSymbolId in q.solutionSymbolsMustDiffFirst) {
                        let userSymTerm = new Symbolic.SellSymTerm();
                        if(userSymTerm.importMathJsTerm(userSolution)) {
                            let diffVar = q.solutionSymbolsMustDiffFirst[solutionSymbolId];
                            userSolution = userSymTerm.derivate(diffVar);
                            userSolution = userSolution.toString();
                            ok = solutionSymbol.value.compareWithStringTerm(userSolution);
                        } else
                            ok = false;
                    } else {
                        ok = solutionSymbol.value.compareWithStringTerm(userSolution);
                    }
                    if (!ok && solutionSymbol.value.state == "syntaxerror") {
                        switch (this.p.language) {
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
                    for (let k = 0; k < this.p.matrixInputs.length; k++) {
                        if (this.p.matrixInputs[k].id === "sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId) {
                            matrixInput = this.p.matrixInputs[k];
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
                                    switch (this.p.language) {
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
                            console.log(solutionSymbol.value)
                            console.log(mat_user)
                            ok = LinAlg.SellLinAlg.mat_compare_numerically(solutionSymbol.value, mat_user);
                        }
                    } else {
                        switch (this.p.language) {
                            case "en":
                                feedback_additional_text += 'Dimensioned incorrectly!';
                                break;
                            case "de":
                                feedback_additional_text += 'Falsche Dimensionierung!';
                                break;
                        }
                    }
                    break;

                case symtype.T_MATRIX_OF_FUNCTIONS:

                    matrixInput = null;
                    for (let k = 0; k < this.p.matrixInputs.length; k++) {
                        if (this.p.matrixInputs[k].id === "sell_input_" + this.p.instanceID + '_' + qidx + '_' + solutionSymbolId) {
                            matrixInput = this.p.matrixInputs[k];
                            break;
                        }
                    }
                    m = solutionSymbol.value.m;
                    n = solutionSymbol.value.n;
                    matrixInput.setUnsetElementsToZero();
                    if (matrixInput.m == m && matrixInput.n == n) {
                        ok = true;
                        for (let i = 0; i < m; i++) {
                            for (let j = 0; j < n; j++) {
                                let v_user_text = matrixInput.getElementText(i, j);
                                v_user_text = v_user_text.replace(',', '.');
                                if(solutionSymbol.value.elements[i*n+j].compareWithStringTerm(v_user_text) == false) {
                                    // TODO: report "syntax error", ...
                                    switch (this.p.language) {
                                        case "en":
                                            feedback_additional_text += 'Hint: Element (' + (i+1) + ',' + (j+1) + ') is incorrect!';;
                                            break;
                                        case "de":
                                            feedback_additional_text += 'Tipp: Element (' + (i+1) + ',' + (j+1) + ') ist noch fehlerhaft!';;
                                            break;
                                    }
                                    ok = false;
                                    break;
                                }
                            }
                            if(!ok)
                                break;
                        }
                    } else {
                        switch (this.p.language) {
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
                    sellassert(false, "evaluateUserInput: solution type '" + solutionSymbol.type + "' is unimplemented");
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
        let generalFeedback = this.p.getElementByIdAndType("sell_input_feedback_" + this.p.instanceID + '_' + qidx + '_general_feedback', this.p.ELEMENT_TYPE_SPAN);
        if (containsSingleChoice && !selectedAnySingleChoiceOption) {
            switch (this.p.language) {
                case "en":
                    generalFeedback.innerHTML = '<span class="text-danger">No answer chosen!</span>';
                    break;
                case "de":
                    generalFeedback.innerHTML = '<span class="text-danger">Keine Antwort gewählt!</span>';
                    break;
            }
        } else if(!allMultipleChoiceAnswersCorrect) {
            switch (this.p.language) {
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

}
