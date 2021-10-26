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

// This file supports creating CodeMirror instances.
// Dev note: node.js cannot import CodeMirror, since DOM must be present.

sellquiz.__ideCreationFuntion(function _(sellinput, textarea, prog_lang, height) {
    let cmLang = "";
    switch(prog_lang) {
        case "java":
            cmLang = "text/x-java";
            break;
        default:
            console.log(">>> sellquiz.ide.js: unimplemented programming language");
    }
    let cm = CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: cmLang
    });
    cm.setSize(null, height);
    sellinput.codeMirror = cm;

    // show predefined source
    let givenSrc = sellinput.solutionVariableRef.value["given"];
    // hide everything between '§' and '§'
    givenSrc = givenSrc.replace(/§\d*§/g, "?");

    cm.setValue(givenSrc);
    cm.on('beforeChange',function(cm,change) {
        if(change.from.line < givenSrc.split("\n").length-1) {
            change.cancel();
        }
    });

});
