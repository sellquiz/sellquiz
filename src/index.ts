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

var sellQuizInst : quiz.SellQuiz = new quiz.SellQuiz();

/**
 * Remove all questions.
 */
function reset() {
    let createIDEBackup = sellQuizInst.createIDE;
    sellQuizInst = new quiz.SellQuiz();
    sellQuizInst.createIDE = createIDEBackup;
}

/**
 * Creates a quiz including HTML control elements. This function can be used for a trivial integration of a stand-alone SELL quiz into a website. WARNING: do not mix using this high-level function and low-level functions.
 * @param sellCode SELL source code of one or multiple questions (divided by a line equal to %%%).
 * @param htmlDivElement HTML element that will contain all questions.
 * @param editButton Renders a button with label "Edit" right to the "Evaluate" button.
 * @returns Success.
 */
function autoCreateQuiz(sellCode : string, htmlDivElement : HTMLElement, editButton = false) : boolean {
    sellQuizInst.editButton = editButton;
    if(sellQuizInst.importQuestions(sellCode) == false)
        return false;
    htmlDivElement.innerHTML = sellQuizInst.html;
    for(let i=0; i<sellQuizInst.questions.length; i++) {
        let q = sellQuizInst.questions[i];
        let id = q.idx;
        let questionHtmlElement = getHtmlChildElementRecursive(
            htmlDivElement, 'sell_question_html_element_' + id);
        setQuestionHtmlElement(id, <HTMLElement>questionHtmlElement);
        refreshQuestion(id);
    }
    return true;
}

/**
 * Evaluates a quiz that has been created by autoCreateQuiz(..). This function is called automatically.
 * @param questionID Question index.
 * @param htmlQuestionElementID Identifier of the (global) HTML element that contains all questions.
 * @returns Success.
 */
function autoEvaluateQuiz(questionID : number, htmlQuestionElementID : string) : boolean {
    let htmlQuestionElement = document.getElementById(htmlQuestionElementID);
    sellassert(htmlQuestionElement != null, "autoEvaluateQuiz(..): question HTML element is null");
    readStudentAnswersFromHtmlElements(questionID);
    if(evaluateQuestion(questionID) == false)
        return false;
    autoEvaluateQuiz2(questionID, htmlQuestionElement);
    return true;
}

// TODO: doc (this is an internal function)
function autoEvaluateQuiz2(questionID : number, htmlQuestionElement : HTMLElement) : boolean {
    let evalReady = sellQuizInst.evaluate.isEvaluationReady(questionID);
    if(!evalReady) {
        setTimeout(function(){
            autoEvaluateQuiz2(questionID, htmlQuestionElement); // TODO: process return value??
        }, 100);
        return true;
    }
    writeFeedbackToHtmlElements(questionID);
    let htmlGeneralFeedbackElement = getHtmlChildElementRecursive(htmlQuestionElement, "general_feedback");
    sellassert(htmlGeneralFeedbackElement != null, "autoEvaluateQuiz(..): feedback HTML element is null");
    htmlGeneralFeedbackElement.innerHTML = getFeedbackText(questionID);
    return true;
}

/**
 * Returns the SELL code of a given question ID.
 * @param questionID Question index.
 * @returns SELL code of question given by ID, or empty string in case that the question is invalid.
 */
function getQuestionSource(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return null;
    return q.src;
}

/**
 * Sets the language for text outputs. Default is "en" := English.
 * @param langID Language identifier (one of {"en", "de"}).
 */
function setLanguage(langID : string) : void {
    sellQuizInst.language = langID;
}

/**
 * Sets the path for "services/" (only required, if programming tasks are used)
 * @param path path to directory "service/"
 */
function setServicePath(path : string) : void {
    sellQuizInst.servicePath = path;
}

/**
 * Enables (or disables) the generation of HTML code for input and feedback element.
 * @param enable If false, then getQuestionBody() returns HTML code that includes only placeholders for input and feedback fields. Placeholders have the form '$$ID', where ID can be obtained by calling getQuestionInputFields().
 */
function setGenerateInputFieldHtmlCode(enable : boolean = true) : void {
    sellQuizInst.generateInputFieldHtmlCode = enable;
}

/**
 * Creates a new question.
 * @param sellCode SELL source code of a single question.
 * @returns Question index or -1 in case of errors.
 */
function createQuestion(sellCode : string) : number {
    sellQuizInst.editButton = false;
    if(sellQuizInst.importQuestion(sellCode) == false)
        return -1;
    return sellQuizInst.qidx;
}

/**
 * Creates a new question from a question backup (refer to function backupQuestion(..)).
 * @param questionBackup Backup string (stringified JSON).
 * @returns Question index or -1 in case of errors.
 */
function createQuestionFromBackup(questionBackupStr : string) : number {
    return sellQuizInst.createQuestionFromBackup(questionBackupStr);
}

/**
 * Creates a backup of a question which includes internal states (for example random variables).
 * @param questionID Question index.
 * @resturns Stringified JSON object of the question state or null in case that an error occourred.
 */
function backupQuestion(questionID : number) : string {
    return sellQuizInst.backupQuestion(questionID);
}

/**
 * Gets the input fields of a question. * 
 * @param questionID Question index.
 * @returns Array of dictionaries with entries "element_id" for the HTML element identifier, "element_type" for the HTML element type (refer to enum SellInputElementType in file quiz.js) and "solution_variable_id" the identifier of the corresponding soluion variable.
 */
function getQuestionInputFields(questionID : number) : [{[id:string]: string}] {
    return sellQuizInst.getQuestionInputFields(questionID);
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
 * Gets question high-level HTML, i.e. question-title and qustion-body in a Boostrap-Card element with evaluation button.
 * @param questionID Question index.
 * @returns Qustion HTML code or an empty string, if the question does not exist.
 */
function getQuestionHighLevelHTML(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return "";
    return q.html;
}

/**
 * Sets the HTML element that contains the question body (Alternatively, the element can also be a parent element of the question body). This function must be called once before calling "readStudentAnswersFromHtmlElements" or "writeFeedbackToHtmlElements".
 * @param questionID Question index.
 * @param element HTML element that contains the question body.
 * @returns Success.
 */
function setQuestionHtmlElement(questionID : number, element : HTMLElement) : boolean {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return false;
    q.bodyHtmlElement = element;
    return true;
}

/**
 * Evaluates the student answers of a question. This function does NOT read and write HTML elements. Also refer to functions "readStudentAnswersFromHtmlElements" and "writeFeedbackToHtmlElements".
 * @param questionID Question index.
 * @returns Success.
 */
function evaluateQuestion(questionID : number) : boolean {
    return sellQuizInst.evaluate.evaluate(questionID);
}

/**
 * Reads student answers from HTML elements. Also refer to functions "evaluateQuestion" and "writeFeedbackToHtmlElements".
 * @param questionID Question index.
 * @returns Success.
 */
function readStudentAnswersFromHtmlElements(questionID : number) : boolean {
    return sellQuizInst.evaluate.getStudentAnswers(questionID);
}

/**
 * Sets a student answer string manually. Also refer to functions "getInputElements" and "backupQuestion"
 * @param questionID Question index.
 * @param htmlElementId HTML element identifier.
 * @param answerStr Answer string in ASCII-math encoding (e.g. "a+bi" for complex numbers, "[a,b,c]" for vectors, "[[a,b],[c,d]]" for matrices).
 * @returns Success.
 */
function setStudentAnswerManually(questionID : number, solutionVariableID : string, answerStr : string) : boolean {
    return sellQuizInst.evaluate.setStudentAnswerManually(questionID, solutionVariableID, answerStr);
}

/**
 * Writes feedback to HTML elements. Also refer to functions "evaluateQuestion" and "readStudentAnswersFromHtmlElements".
 * @param questionID Question index.
 * @returns Success.
 */
 function writeFeedbackToHtmlElements(questionID : number) : boolean {
    return sellQuizInst.evaluate.displayFeedback(questionID);
}


/**
 * Gets the feedback text of an already evaluated question.
 * @param questionID Question Index.
 * @returns Success.
 */
 function getFeedbackText(questionID : number) : string {
    let q = sellQuizInst.getQuestionByIdx(questionID);
    if(q == null)
        return "";
    return q.generalFeedbackStr;
}

/**
 * Gets the evaluation score of an already evaluted question.
 * @param questionID Question Index. 
 * @returns Score in range [0, 1]
 */
function getScore(questionID : number) : number {
    return sellQuizInst.evaluate.getScore(questionID);
}

/**
 * Enables all input field HTML elements for editing.
 * @param questionID Question index.
 * @returns Success.
 */
function enableInputFields(questionID : number) : boolean {
    return sellQuizInst.enableInputFields(questionID, false);
}

/**
 * Disables all input field HTML elements for editing.
 * @param questionID Question index.
 * @returns Success.
 */
function disableInputFields(questionID : number) : boolean {
    return sellQuizInst.enableInputFields(questionID, false);
}

/**
 * Refreshes the HTML elements of a questions. This is mainly required for matrices that can be resized by students. This function is mainly called internally.
 * @param questionID Question index.
 * @returns Success.
 */
function refreshQuestion(questionID : number) : boolean {
    if(sellQuizInst.updateMatrixInputs(questionID) == false)
        return false;
    if(sellQuizInst.createProgrammingTaskEditors(questionID) == false)
        return false;
    return true;
}

/**
 * Updates the number of rows and columns of a matrix input. Thes function is mainly called internally.
 * @param questionID Question index.
 * @param htmlElementId Identifier of the corresponding matrix input HTML element.
 * @param deltaRows Number of rows added (subtracted).
 * @param deltaCols Number of columns added (subtracted).
 * @returns Success.
 */
function refreshMatrixDimensions(questionID : number, matrixId : string, deltaRows : number, deltaCols : number) : boolean {
    return sellQuizInst.updateMatrixDims(questionID, matrixId, deltaRows, deltaCols);
}

// TODO:
function __ideCreationFuntion(fct : any) {
    sellQuizInst.createIDE = fct;
}

export { 
    reset,
    autoCreateQuiz,
    autoEvaluateQuiz,
    getQuestionSource,
    setLanguage,
    setServicePath,
    setGenerateInputFieldHtmlCode,
    createQuestion,
    createQuestionFromBackup,
    backupQuestion,
    getQuestionInputFields,
    getErrorLog, 
    getQuestionTitle, 
    getQuestionBody, 
    getQuestionHighLevelHTML,
    setQuestionHtmlElement,
    evaluateQuestion,
    readStudentAnswersFromHtmlElements,
    setStudentAnswerManually,
    writeFeedbackToHtmlElements,
    getFeedbackText,
    getScore,
    enableInputFields,
    disableInputFields,
    refreshQuestion,
    refreshMatrixDimensions,
    __ideCreationFuntion
};
