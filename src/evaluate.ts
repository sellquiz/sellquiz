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

import * as math from 'mathjs';
import * as $ from 'jquery';

import { SellInput, SellInputElementType, SellQuestion, SellQuiz } from './quiz.js';
import { sellassert } from './sellassert.js';
import { SellSymbol, symtype } from './symbol.js';
import { sellLevenShteinDistance, getHtmlChildElementRecursive } from './help.js';
import { GET_STR, checkmark, crossmark } from './lang.js';
import { SellSymTerm } from './symbolic.js';
import { SellLinAlg } from './linalg.js';

export class Evaluate {

    p : SellQuiz;
    
    selectedAnySingleChoiceOption : boolean = false;
    questionContainsSingleChoice : boolean = false;

    allMultipleChoiceAnswersAreCorrect : boolean = true;

    constructor(parent : SellQuiz) {
        this.p = parent;
    }

    // TODO: replace asserts by error log!!

    setStudentAnswerManually(qidx : number, solutionVariableId : string, answerStr : string) : boolean {
        let q = this.p.getQuestionByIdx(qidx);
        if(q == null)
            return false;
        let input : SellInput = null;
        for(let i=0; i<q.inputs.length; i++) {
            if(q.inputs[i].solutionVariableId == solutionVariableId) {
                input = q.inputs[i];
                break;
            }
        }
        if(input == null) {
            sellassert(false, "setStudentAnswerManually(): could not find input element for given solution variable '" + solutionVariableId + "'");
        }
        switch(input.htmlElementInputType) {
            case SellInputElementType.TEXTFIELD:
                input.studentAnswer = [ answerStr ];
                break;
            default:
                sellassert(false, "setStudentAnswerManually(): UNIMPLEMENTED!")
                break;
        }
        return true;
    }

    getStudentAnswers(qidx : number) : boolean {
        let q = this.p.getQuestionByIdx(qidx);
        if(q == null)
            return false;
        if(q.bodyHtmlElement == null)
            sellassert(false, 
                "getStudentAnswers(): bodyHtmlElement was not set");
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            let htmlElement = null;
            switch(input.htmlElementInputType) {
                case SellInputElementType.TEXTFIELD:
                    htmlElement = getHtmlChildElementRecursive(
                        q.bodyHtmlElement, input.htmlElementId);
                    sellassert(htmlElement != null, 
                        "getStudentAnswers(): failed to get HTML child element: " 
                        + input.htmlElementId);
                    input.studentAnswer = [ (<HTMLInputElement>htmlElement).value ];
                    break;
                case SellInputElementType.COMPLEX_NUMBER:
                    // real part
                    htmlElement = getHtmlChildElementRecursive(
                        q.bodyHtmlElement, input.htmlElementId + '_real');
                    sellassert(htmlElement != null, 
                        "getStudentAnswers(): failed to get HTML child element: " 
                        + input.htmlElementId);
                    if((<HTMLInputElement>htmlElement).value.length == 0)
                        (<HTMLInputElement>htmlElement).value = "0";
                    input.studentAnswer = [ (<HTMLInputElement>htmlElement).value ];
                    // imaginay parg
                    htmlElement = getHtmlChildElementRecursive(
                        q.bodyHtmlElement, input.htmlElementId + '_imag');
                    sellassert(htmlElement != null, 
                        "getStudentAnswers(): failed to get HTML child element: " 
                        + input.htmlElementId);
                    if((<HTMLInputElement>htmlElement).value.length == 0)
                        (<HTMLInputElement>htmlElement).value = "0";
                    input.studentAnswer.push((<HTMLInputElement>htmlElement).value);
                    break;
                case SellInputElementType.CHECKBOX:
                    htmlElement = getHtmlChildElementRecursive(
                        q.bodyHtmlElement, input.htmlElementId);
                    sellassert(htmlElement != null, 
                        "getStudentAnswers(): failed to get HTML child element: " 
                        + input.htmlElementId);
                    input.studentAnswer = [ (<HTMLInputElement>htmlElement).checked ? "true" : "false" ];
                    break;
                case SellInputElementType.VECTOR:
                    input.studentAnswer = [];
                    for(let i=0; i<input.vectorLength; i++) {
                        htmlElement = getHtmlChildElementRecursive(
                            q.bodyHtmlElement, input.htmlElementId + '_' + i);
                        sellassert(htmlElement != null, 
                            "getStudentAnswers(): failed to get HTML child element: " 
                            + input.htmlElementId);
                        if((<HTMLInputElement>htmlElement).value.length == 0) {
                            (<HTMLInputElement>htmlElement).value = "0";
                        }
                        input.studentAnswer.push((<HTMLInputElement>htmlElement).value); 
                    }
                    break;
                case SellInputElementType.MATRIX:
                    input.matrixInput.setUnsetElementsToZero();
                    input.studentAnswer = input.matrixInput.getStudentAnswer();
                    break;
                case SellInputElementType.JAVA_PROGRAMMING:
                    htmlElement = getHtmlChildElementRecursive(
                        q.bodyHtmlElement, input.htmlElementId);
                    sellassert(htmlElement != null, 
                        "getStudentAnswers(): failed to get HTML child element: " 
                        + input.htmlElementId);
                    input.studentAnswer = [ input.codeMirror.getValue() ];
                    break;
                default:
                    sellassert(false, "getStudentAnswers(..): UNIMPLEMENTED HTML element type '" + input.htmlElementInputType + "'");
            }
        }
        return true;
    }

    displayFeedback(qidx : number) : boolean {
        let q = this.p.getQuestionByIdx(qidx);
        if(q == null)
            return false;
        if(q.bodyHtmlElement == null)
            sellassert(false, "displayFeedback(): bodyHtmlElement was not set");
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            let htmlElement = getHtmlChildElementRecursive(q.bodyHtmlElement, input.htmlElementId_feedback);
            sellassert(htmlElement != null, "displayFeedback(): failed to get HTML child element: " + input.htmlElementId);
            htmlElement.innerHTML = input.evaluationFeedbackStr;
        }
        return true;
    }

    getScore(qidx : number) : number {
        // TODO: scoring is not yet weighted correctly etc...
        let q = this.p.questions[qidx];
        if(q == null)
            return -1;
        let score = 0.0;
        if(q.inputs.length == 0)
            return score;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.correct)
                score += 1.0;
        }
        score /= q.inputs.length;
        return score;
    }

    evaluate(qidx : number) : boolean {
        this.selectedAnySingleChoiceOption = false;
        this.questionContainsSingleChoice = false;
        let q = this.p.questions[qidx];
        if(q == null)
            return false;
        this.checkIfAllMultipleChoiceAnswersAreCorrect(q);
        q.generalFeedbackStr = "";
        q.allAnswersCorrect = true;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            let v = q.solutionSymbols[input.solutionVariableId];
            sellassert(v != null, "evaluate(): unknown solution symbol " + input.solutionVariableId + " known solution symbols: " + JSON.stringify(q.solutionSymbols));
            input.evaluationInProgress = false;
            switch(v.type) {
                case symtype.T_BOOL:
                    this.evaluateBool(q, input, v);
                    break;
                case symtype.T_REAL:
                    this.evaluateReal(q, input, v);
                    break;
                case symtype.T_COMPLEX:
                    this.evaluateComplex(q, input, v);
                    break;
                case symtype.T_FUNCTION:
                    this.evaluateFunction(q, input, v);
                    break;
                case symtype.T_STRING_LIST:
                    this.evaluateStringList(q, input, v);
                    break;
                case symtype.T_SET:
                case symtype.T_COMPLEX_SET:
                    this.evaluateSet(q, input, v);
                    break;
                case symtype.T_MATRIX:
                case symtype.T_MATRIX_OF_FUNCTIONS:
                    this.evaluateMatrix(
                        v.type == symtype.T_MATRIX_OF_FUNCTIONS, 
                        q, input, v);
                    break;
                case symtype.T_JAVA_PROGRAMMING:
                    input.evaluationInProgress = true;
                    this.evaluateJavaProgramming(q, input, v);
                    break;
                default:
                    sellassert(false, "evaluate(): unimplemented math type: " + v.type.toString());
            }
        }
        if(this.questionContainsSingleChoice && this.selectedAnySingleChoiceOption == false) {
            q.generalFeedbackStr += GET_STR("no_answer_selected", this.p.language);
        }
        if(!this.allMultipleChoiceAnswersAreCorrect) {
            q.generalFeedbackStr += GET_STR("not_yet_correct", this.p.language);
        }
        return true;
    }

    isEvaluationReady(qidx : number) : boolean {
        let q = this.p.questions[qidx];
        if(q == null)
            return true;
        for(let i=0; i<q.inputs.length; i++) {
            let input = q.inputs[i];
            if(input.evaluationInProgress)
                return false;
        }
        return true;
    }

    checkIfAllMultipleChoiceAnswersAreCorrect(question : SellQuestion) {
        this.allMultipleChoiceAnswersAreCorrect = true;
        for(let i=0; i<question.inputs.length; i++) {
            let input = question.inputs[i];
            if(input.solutionVariableId.includes('_mc_')) {
                let studentAnswer = input.studentAnswer[0] === "true";
                let solution = question.solutionSymbols[input.solutionVariableId].value;
                if(studentAnswer != solution) {
                    this.allMultipleChoiceAnswersAreCorrect = false;
                    break;
                }
            }
        }
    }

    evaluateBool(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let studentAnswer = input.studentAnswer[0] === "true";
        input.correct = solutionVariable.value == studentAnswer;
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        if(input.solutionVariableId.includes('_sc_')) {
            this.questionContainsSingleChoice = true;
            // if the input is a single-choice option, then only show feedback, if student
            // seleted this option:
            if(studentAnswer == false)
                input.evaluationFeedbackStr = "";
            if(studentAnswer == true)
                this.selectedAnySingleChoiceOption = true;
        } else if(input.solutionVariableId.includes('_mc_')) {
            // only give feedback, if all multiple-choice answers are correct
            if(this.allMultipleChoiceAnswersAreCorrect == false)
                input.evaluationFeedbackStr = "";
        }
        if(input.correct == false)
            question.allAnswersCorrect = false;
    }

    evaluateReal(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let studentAnswerStr = input.studentAnswer[0].replaceAll(',', '.');
        let studentAnwser = 0;
        let feedback = '';
        try {
            studentAnwser = math.evaluate(studentAnswerStr);
            input.correct = math.abs(solutionVariable.value - studentAnwser) < solutionVariable.precision;
        } catch(e) {
            feedback += GET_STR("feedback_syntaxerror", this.p.language).replace("$", studentAnswerStr) + "&nbsp;&nbsp;";
            input.correct = false;
            question.allAnswersCorrect = false;    
        }
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
        if(input.correct == false)
            question.allAnswersCorrect = false;
    }

    evaluateComplex(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        // TODO: need property in SELL language, if trigonometric functions are allowed -> check here

        let studentAnswerStrReal = input.studentAnswer[0].replaceAll(',', '.');
        let studentAnswerStrImag = input.studentAnswer[1].replaceAll(',', '.');
        let studentAnwserReal = 0, studentAnswerImag = 0;
        let feedback = '';
        input.correct = true;
        try {
            studentAnwserReal = math.evaluate(studentAnswerStrReal);
        } catch(e) {
            input.correct = false;
            question.allAnswersCorrect = false;
            feedback += GET_STR("feedback_syntaxerror", this.p.language).replace("$", studentAnswerStrReal) + "&nbsp;&nbsp;";
        }
        try {
            studentAnswerImag = math.evaluate(studentAnswerStrImag);
        } catch(e) {
            input.correct = false;
            question.allAnswersCorrect = false;
            feedback += GET_STR("feedback_syntaxerror", this.p.language).replace("$", studentAnswerStrImag) + "&nbsp;&nbsp;";
        }
        if(input.correct) {
            let studentAnswer = math.complex(studentAnwserReal, studentAnswerImag) as any;
            input.correct = math.abs(math.subtract(solutionVariable.value, studentAnswer) as any) < solutionVariable.precision;
        }        
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
        if(input.correct == false)
            question.allAnswersCorrect = false;    
    }

    evaluateStringList(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let studentAnswerStr = input.studentAnswer[0];
        let feedback = '';
        input.correct = true;
        for(let i=0; i<solutionVariable.value.length; i++) {
            let sol_i = solutionVariable.value[i];
            let levDist = sellLevenShteinDistance(studentAnswerStr, sol_i);
            levDist = math.abs(levDist);
            let correct = sol_i.length<=3 ? levDist==0 : levDist<=2;
            if(sol_i.length>3 && levDist > 0 && levDist <= 2)
                feedback = '<span class="text-warning">' + sol_i + '</span>';
            else
                feedback = '';
            if(correct == false) {
                input.correct = false;
                question.allAnswersCorrect = false;
                break;
            }
        }
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
    }

    evaluateFunction(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let studentAnswerStr = input.studentAnswer[0].replaceAll(',', '.');
        let feedback = '';
        if(studentAnswerStr.length == 0)
            studentAnswerStr = "123456789123456789"; // if no answer is given, do not assume "0", since zero is often a valid answer
        if(input.solutionVariableId in question.solutionSymbolsMustDiffFirst) {
            let studentAnswer = new SellSymTerm();
            if(studentAnswer.importTerm(studentAnswerStr) == false) {
                question.allAnswersCorrect = false;
                input.correct = false;
                feedback += GET_STR("feedback_syntaxerror", this.p.language).
                    replace("$", studentAnswerStr) + "&nbsp;&nbsp;";
                input.evaluationFeedbackStr = crossmark + feedback;
                return;
            }
            let diffVar = question.solutionSymbolsMustDiffFirst[input.solutionVariableId];
            studentAnswer = studentAnswer.derivate(diffVar);
            studentAnswerStr = studentAnswer.toString();
        }
        input.correct = solutionVariable.value.compareWithStringTerm(studentAnswerStr);
        if(input.correct == false) {
            question.allAnswersCorrect = false;
            if(solutionVariable.value.state === "syntaxerror") {
                feedback += GET_STR("feedback_syntaxerror_or_invalid_variables", this.p.language).
                    replace("$", studentAnswerStr) + "&nbsp;&nbsp;";
            }
        }
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
    }

    evaluateSet(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let studentAnswer = [];
        let n = solutionVariable.value.length;
        let feedback = '';
        for(let i=0; i<n; i++) {
            let studentAnswerStr_i = input.studentAnswer[i].replaceAll(',', '.').replaceAll('j', 'i');
            let studentAnswer_i = 0;
            try {
                studentAnswer_i = math.evaluate(studentAnswerStr_i);
            } catch(e) {
                feedback += GET_STR("feedback_syntaxerror", this.p.language).
                    replace("$", studentAnswerStr_i) + "&nbsp;&nbsp;";
            }
            studentAnswer.push(studentAnswer_i);
        }
        let num_ok = 0;
        for(let i=0; i<n; i++) {
            let sol = solutionVariable.value[i].value;
            for (let j=0; j<n; j++) {
                let user_sol = studentAnswer[j];
                let diff = math.abs(math.subtract(sol, user_sol) as any);
                if (diff < solutionVariable.precision) {
                    num_ok++;
                    break;
                }
            }
        }
        input.correct = num_ok == n;
        if(num_ok < n) {
            question.allAnswersCorrect = false;
            let f = GET_STR("i_out_of_n_correct", this.p.language) + "&nbsp;&nbsp;";
            f = f.replace('$i', ''+num_ok);
            f = f.replace('$n', ''+n);
            feedback += f;
        }
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
    }

    evaluateMatrix(functionalElements : boolean, question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {
        let m=0, n=0;
        if(functionalElements) {
            m = solutionVariable.value.m;
            n = solutionVariable.value.n;
        } else {
            m = SellLinAlg.mat_get_row_count(solutionVariable.value);
            n = SellLinAlg.mat_get_col_count(solutionVariable.value);
        }
        input.correct = true;
        let feedback = '';
        if(input.matrixInput.m != m || input.matrixInput.n != n) {
            input.correct = false;
            question.allAnswersCorrect = false;
            feedback += GET_STR("dimensions_incorrect", this.p.language) + "&nbsp;&nbsp;";
        }
        if(input.correct) {
            for(let i=0; i<m; i++) {
                for(let j=0; j<n; j++) {
                    let k = i*n + j;
                    let studentAnswerStr = input.studentAnswer[k].replaceAll(',', '.');
                    let correct = true;
                    if(functionalElements) {
                        correct = solutionVariable.value.elements[k].compareWithStringTerm(studentAnswerStr);
                        if(solutionVariable.value.state === "syntaxerror") {
                            input.correct = false;
                            question.allAnswersCorrect = false;
                            feedback += GET_STR("feedback_syntaxerror_or_invalid_variables", this.p.language).replace("$", studentAnswerStr) + "&nbsp;&nbsp;";
                            break;
                        }
                    } 
                    else {
                        let studentAnswer = 0.0;
                        try {
                            studentAnswer = math.evaluate(studentAnswerStr);
                        } catch(e) {
                            input.correct = false;
                            question.allAnswersCorrect = false;
                            feedback += GET_STR("feedback_syntaxerror", this.p.language).replace("$", studentAnswerStr) + "&nbsp;&nbsp;";
                            break;
                        }
                        if(math.abs(studentAnswer - SellLinAlg.mat_get_element_value(solutionVariable.value, i, j)) > solutionVariable.precision) {
                            input.correct = false;
                            question.allAnswersCorrect = false;
                            break;
                        }
                    }
                    if(!correct) {
                        input.correct = false;
                        question.allAnswersCorrect = false;
                        let hint = GET_STR("hint_matrix_element", this.p.language);
                        hint = hint.replaceAll('$i', ''+(i+1));
                        hint = hint.replaceAll('$j', ''+(j+1));
                        feedback += hint + "&nbsp;&nbsp;";
                        break;
                    }
                }
                if(input.correct == false)
                    break;
            }
        }
        input.evaluationFeedbackStr = input.correct ? checkmark : crossmark;
        input.evaluationFeedbackStr += feedback;
    }

    evaluateJavaProgramming(question : SellQuestion, input : SellInput, solutionVariable : SellSymbol) {

        //console.log(solutionVariable.value)

        let task = {
            "type": solutionVariable.value["type"],
            "source": input.studentAnswer[0],
            "asserts": solutionVariable.value["asserts"]
        };
        //let service_url = "http://localhost:8000/services/service-prog.php"; // TODO: MAKE URL CHANGABLE!!
        let service_url = "./services/service-prog.php"; // TODO: MAKE URL CONFIGURABLE!!

        // TODO: must forbid running twice!!!!!

        let feedback_htmlElement = getHtmlChildElementRecursive(question.bodyHtmlElement, input.htmlElementId_feedback);
        console.log(feedback_htmlElement);
        console.log(feedback_htmlElement.innerHTML);
        feedback_htmlElement.innerHTML = "<span class=\"text-danger\">bitte warten...</span>"; // TODO: use lang.ts!!!!
        $.ajax({
            type: "POST",
            url: service_url,
            data: {
                input: JSON.stringify(task)
            },
            success: function(data) {
                data = JSON.parse(data);
                let status = data["status"];
                let message = data["msg"];
                input.correct = status === "ok";
                input.evaluationFeedbackStr = input.correct ? checkmark + " korrekt!" : crossmark; // TODO: use lang.ts!!!!
                //if(message.length > 0 && message[message.length-1] == "\n")
                //    message = message.substring(0, message.length-1);
                input.evaluationFeedbackStr += ' &nbsp; <code>' + message.replaceAll("\n", "<br/>") + '</code>';
                if(input.correct == false)
                    question.allAnswersCorrect = false;
                input.evaluationInProgress = false;
            },
            error: function(xhr, status, error) {
                console.error(xhr); // TODO: error handling!
            }
        });
    }

}
