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

import * as quiz from './quiz.js';
import { sellassert } from './sellassert.js';
import { getHtmlChildElementRecursive } from './help.js';

var sellQuizInst = new quiz.SellQuiz();

/**
 * Creates a quiz including HTML control elements. This function can be used for a trivial integration of a stand-alone SELL quiz into a website. WARNING: do not mix using this high-level function and low-level functions.
 * @param sellCode SELL source code of one or multiple questions (divided by a line equal to %%%)
 * @param htmlDivElement HTML element that will contain all questions.
 * @returns success.
 */
function autoCreateQuiz(sellCode : string, htmlDivElement : HTMLElement) : boolean {
    if(sellQuizInst.importQuestions(sellCode) == false)
        return false;
    htmlDivElement.innerHTML = sellQuizInst.html;
    for(let i=0; i<sellQuizInst.questions.length; i++) {
        let q = sellQuizInst.questions[i];
        let id = q.idx;
        let questionHtmlElement = getHtmlChildElementRecursive(
            htmlDivElement, 'sell_question_html_element_' + id);
        setQuestionBodyHtmlElement(id, <HTMLElement>questionHtmlElement);
        refreshQuestion(id);
    }
    return true;
}

/**
 * TODO: doc
 * @param questionID 
 * @param htmlQuestionElementID 
 * @returns 
 */
function autoEvaluateQuiz(questionID : number, htmlQuestionElementID : string) : boolean {
    let htmlQuestionElement = document.getElementById(htmlQuestionElementID);
    sellassert(htmlQuestionElement != null, "autoEvaluateQuiz(..): question HTML element is null");
    if(evaluateQuestion(questionID) == false)
        return false;
    let htmlGeneralFeedbackElement = getHtmlChildElementRecursive(htmlQuestionElement, "general_feedback");
    sellassert(htmlGeneralFeedbackElement != null, "autoEvaluateQuiz(..): feedback HTML element is null");
    htmlGeneralFeedbackElement.innerHTML = getFeedbackText(questionID);
    return true;
}

/**
 * Sets the language for text outputs. Default is "en" := English.
 * @param langID Language identifier (one of {"en", "de"}).
 */
function setLanguage(langID : string) : void {
    sellQuizInst.language = langID;
}

/**
 * Creates a new question.
 * @param sellCode SELL source code of a single question.
 * @returns Question index or -1 in case of errors.
 */
function createQuestion(sellCode : string) : number {
    if(sellQuizInst.importQuestion(sellCode) == false)
        return -1;
    return sellQuizInst.qidx;
}

/**
 * Gets the error log for the last created question.
 * @returns Error log.
 */
function getErrorLog() : string {
    return sellQuizInst.log;
}

/**
 * Gets the question title.
 * @param questionID Question index.
 * @returns Title as HTML code or an empty string, if the question does not exist.
 */
function getQuestionTitle(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return "";
    return q.titleHtml;
}

/**
 * Gets the question body.
 * @param questionID Question index.
 * @returns Body as HTML code or an empty string, if the question does not exist.
 */
function getQuestionBody(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return "";
    return q.bodyHtml;
}

/**
 * Sets the HTML element that contains the question body. This function must be called once before quiz evaluation.
 * @param questionID Question index.
 * @param element HTML element that contains the question body.
 * @returns success
 */
function setQuestionBodyHtmlElement(questionID : number, element : HTMLElement) : boolean {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return false;
    q.bodyHtmlElement = element;
    return true;
}

/**
 * Evaluates the question and updates the question HTML element.
 * @param questionID Question index.
 * @returns success.
 */
function evaluateQuestion(questionID : number) : boolean {
    if(sellQuizInst.evaluate.getStudentAnswers(questionID) == false)
        return false;
    if(sellQuizInst.evaluate.evaluate(questionID) == false)
        return false;
    if(sellQuizInst.evaluate.displayFeedback(questionID) == false)
        return false;
    return true;
}

/**
 * Gets the feedback text of an already evaluated question.
 * @param questionID Question Index.
 * @returns success.
 */
 function getFeedbackText(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return "";
    return q.generalFeedbackStr;
}

/**
 * Gets the evaluation score of an already evaluted question.
 * @param questionID Gets 
 * @returns score in range [0, 1]
 */
function getScore(questionID : number) : number {
    return sellQuizInst.evaluate.getScore(questionID);
}

/**
 * Enables all input field HTML elements for editing.
 * @param questionID Question index.
 * @returns success.
 */
function enableInputFields(questionID : number) : boolean {
    return sellQuizInst.enableInputFields(questionID, false);
}

/**
 * Disables all input field HTML elements for editing.
 * @param questionID Question index.
 * @returns success.
 */
function disableInputFields(questionID : number) : boolean {
    return sellQuizInst.enableInputFields(questionID, false);
}

/**
 * Refreshes the HTML elements of a questions. This is mainly required for matrices that can be resized by students. This function is mainly called internally.
 * @param questionID Question index.
 * @returns success.
 */
function refreshQuestion(questionID : number) : boolean {
    return sellQuizInst.updateMatrixInputs(questionID);
}

/**
 * Updates the number of rows and columns of a matrix input. Thes function is mainly called internally.
 * @param questionID Question index.
 * @param htmlElementId Identifier of the corresponding matrix input HTML element.
 * @param deltaRows Nnumber of rows added (subtracted).
 * @param deltaCols Nnumber of columns added (subtracted).
 * @returns success
 */
function refreshMatrixDimensions(questionID : number, matrixId : string, deltaRows : number, deltaCols : number) : boolean {
    return sellQuizInst.updateMatrixDims(questionID, matrixId, deltaRows, deltaCols);
}

export { 
    autoCreateQuiz,
    autoEvaluateQuiz,
    setLanguage, 
    createQuestion, 
    getErrorLog, 
    getQuestionTitle, 
    getQuestionBody, 
    setQuestionBodyHtmlElement,
    evaluateQuestion,
    getFeedbackText,
    getScore,
    enableInputFields,
    disableInputFields,
    refreshQuestion,
    refreshMatrixDimensions
};
