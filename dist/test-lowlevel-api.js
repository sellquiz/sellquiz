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
import * as sellquiz from './index.js';
sellquiz.setLanguage("en");
// (a) create a question
let questionStr = `Addition
    x := 3
    y := 4
Calculate $x + y = #(x + y)$.
`;
let qId = sellquiz.createQuestion(questionStr);
if (qId < 0) {
    console.log("Failed to import question. Error log:");
    console.log(sellquiz.getErrorLog());
    process.exit(-1);
}
let qTitle = sellquiz.getQuestionTitle(qId);
let qBody = sellquiz.getQuestionBody(qId);
console.log("QUESTION:");
console.log("- title HTML code:\n" + qTitle);
console.log("- body HTML code:\n" + qBody);
//sellquiz.setStudentAnswerManually(qId, "solID0", "99"); // TODO: e.g. write matrix as ASCII-math
//sellquiz.evaluateQuestion(qId);
let qBackup = sellquiz.backupQuestion(qId);
console.log("BACKUP OF QUESTION:\n" + qBackup);
sellquiz.reset();
// (b) restore a question
qId = sellquiz.createQuestionFromBackup(qBackup);
let qInputElements = sellquiz.getQuestionInputFields(qId);
console.log(qInputElements);
let solutionVariableID = qInputElements[0]["solution_variable_id"];
if (sellquiz.setStudentAnswerManually(qId, solutionVariableID, "7") == false) {
    console.log("failed to set student answer");
    process.exit(-1);
}
sellquiz.evaluateQuestion(qId);
qBackup = sellquiz.backupQuestion(qId);
console.log("BACKUP OF QUESTION:\n" + qBackup);
//# sourceMappingURL=test-lowlevel-api.js.map