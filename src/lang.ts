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

import { sellassert } from "./sellassert.js";

var LANG_STR = {
    "feedback_syntaxerror_en": "Syntax error in '$'.",
    "feedback_syntaxerror_de": "Syntaxfehler in '$'.",
    "feedback_syntaxerror_or_invalid_variables_en": "Syntax error or invalid variables in '$'.",
    "feedback_syntaxerror_or_invalid_variables_de": "Syntaxfehler oder unzulässive Variablen in '$'.",
    "no_answer_selected_en": "No answer chosen.",
    "no_answer_selected_de": "Keine Antwort gewählt.",
    "not_yet_correct_en": "Not yet correct. Try again!",
    "not_yet_correct_de": "Noch nicht korrekt. Nochmal versuchen!",
    "dimensions_incorrect_en": "Dimensioned incorrectly!",
    "dimensions_incorrect_de": "Falsche Dimensionierung!",
    "hint_matrix_element_en": "Hint: Element ($i,$j) is incorrect!",
    "hint_matrix_element_de": "Tipp: Element ($i,$j) ist noch fehlerhaft!",
    "i_out_of_n_correct_en": "$i out of $n answers are correct",
    "i_out_of_n_correct_de": "$i von $n Antworten sind korrekt"
}

export const checkmark = ' &#x2705; ';
export const crossmark = ' &#x274C; ';

export function GET_STR(key : string, lang : string = "en") {
    let complete_key = key + '_' + lang;
    sellassert(complete_key in LANG_STR, "GET_STR(..): unknown key " + complete_key);
    return '<span class="text-danger">' + LANG_STR[complete_key] + '</span>';
}
