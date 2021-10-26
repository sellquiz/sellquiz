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

/* This file implements a program evaluation service. Refer to "examples/ex1.json" as example input. (TODO: describe all JSON entries!!)
*/

import * as fs from "fs";
import * as path from "path";

import { execSync } from "child_process";

if(process.argv.length != 3) {
    console.log("usage: node service-prog.js JSON_INPUT_FILE");
    console.log("example: node service-prog.js examples/java-1.json");
    process.exit(-1)
}

const inputPath = process.argv[2];
const inputDirectory = path.dirname(inputPath);

const JAVA_PATH = "/usr/bin/java";
const JAVA_COMPILER_PATH = "/usr/bin/javac";
const PYTHON_PATH = "/usr/bin/python3";

const text = {
    "empty_program_en": "You have submitted an empty program.",
    "empty_program_de": "Sie haben ein leeres Programm abgegeben.",
    "python_imports_not_allowed_en": "'import' is not allowed!",
    "python_imports_not_allowed_de": "'import' nicht erlaubt!",
    "syntax_error_en": "Your code contains syntax errors. Hints:",
    "syntax_error_de": "Der Code enthält Syntaxfehler. Hinweise:",
    "python_error_en": "Your code contains errors. Hints:",
    "python_error_de": "Der Code enthält Fehler. Hinweise:",
    "semantic_errors_en": "Although the code can be compiled, it still contains errors in terms of content.",
    "semantic_errors_de": "Der Code lässt sich zwar kompilieren, enthält aber noch inhaltliche Fehler.",
    "semantic_errors_python_en": "Although the code can be executed, it still contains errors in terms of content.",
    "semantic_errors_python_de": "Der Code lässt sich zwar ausführen, enthält aber noch inhaltliche Fehler.",
    "look_on_datatypes_en": "Take a close look to see whether you have exactly adopted the prescribed data types and identifiers.",
    "look_on_datatypes_de": "Schauen Sie genau hin, ob Sie die vorgeschriebenen Datentypen und Bezeichner exakt übernommen haben.",
    "look_on_identifiers_en": "Take a close look to see whether you have exactly adopted the prescribed identifiers.",
    "look_on_identifiers_de": "Schauen Sie genau hin, ob Sie die vorgeschriebenen Bezeichner exakt übernommen haben.",
    "not_terminating_en": "Your program does not terminate!",
    "not_terminating_de": "Ihr Progamm terminiert nicht!"
};

function runBashCommand(cmd, timeoutMilliseconds=100000000) {
    let res_status=0, res_stdout="", res_stderr="";
    try {
        let options = {
            stdio: 'pipe',
            timeout: timeoutMilliseconds
        };
        res_stdout = execSync(cmd, options).toString();
    } catch(error) {
        res_status = error.status;
        res_stderr = error.stderr.toString();
        res_stdout = error.stdout.toString();
    }
    return [res_status, res_stderr, res_stdout];
}

let inputJson = fs.readFileSync(inputPath);
let input = JSON.parse(inputJson);

function getText(desc) {
    return text[desc+"_"+input["language"]];
}

const JAVA_TEMPLATE = `import java.util.*;public class Main {
/*__METHODS__*/
public static void main(String[] args) {
/*__MAIN__*/
/*__ASSERTS__*/
}}`;

const PYTHON_TEMPLATE = `import sys
#__MAIN__
#__ASSERTS__
`;

let cmd="", status="", stdout="", stderr="", java_src="", python_src="";

let output = {"status": "ok", "msg": ""};

// empty code?
if(input["source"].trim().length == 0) {
    output["status"] = "error";
    output["msg"] = getText("empty_program");
}

// unallowed imports?
if(input["type"].startsWith("Python") && input["source"].includes("import")) {
    output["status"] = "error";
    output["msg"] = getText("python_imports_not_allowed");
}

// try to compile code block without asserts
if(output["status"] === "ok") {
    switch(input["type"]) {
        case "JavaBlock":
            java_src = JAVA_TEMPLATE.replace("/*__MAIN__*/", input["source"] + "\n");
            break;
        case "JavaMethod":
            java_src = JAVA_TEMPLATE.replace("/*__METHODS__*/", input["source"] + "\n");
            break;
        case "Python":
            python_src = PYTHON_TEMPLATE.replace("#__MAIN__", input["source"] + "\n");
            break;
        default:
            output["status"] = "devError";
            output["msg"] = "unknown input type '" + input["type"] + "'!";
            console.log(JSON.stringify(output, null, 4));
            process.exit(-1);
    }
    //console.log(inputDirectory + "/Main.java");
    //console.log(java_src);
    if(input["type"].startsWith("Java")) {
        fs.writeFileSync(inputDirectory + "/Main.java", java_src);
        cmd = JAVA_COMPILER_PATH + " " + inputDirectory + "/Main.java";
        [status, stderr, stdout] = runBashCommand(cmd);
        if(status != 0) {
            output["status"] = "error";
            output.msg += getText("syntax_error") + "\n";
            output.msg += "----------------------------------------\n";
            let errLines = stderr.replaceAll(inputDirectory+"/","").split("\n");
            // adjust line numbers
            for(let i=0; i<errLines.length; i++) {
                if(errLines[i].startsWith("Main.java:")) {
                    let lineNo = parseInt(errLines[i].substring(10)) - 3;
                    let j = 10;
                    for(; j<errLines[i].length; j++) {
                        if(errLines[i][j] == ':')
                            break;
                    }
                    errLines[i] = "Line " + lineNo + errLines[i].substring(j);
                }
            }
            output.msg += errLines.join('\n');
            output.msg += "----------------------------------------\n";
        }
    }
    else if(input["type"].startsWith("Python")) {
        fs.writeFileSync(inputDirectory + "/main.py", python_src);
        cmd = PYTHON_PATH + " " + inputDirectory + "/main.py";
        [status, stderr, stdout] = runBashCommand(cmd, 10*1000); // run max 10 seconds
        if(status != 0) {
            output["status"] = "error";
            if(status == 143)
                output.msg += getText("not_terminating");
            else {
                output.msg += getText("python_error") + "\n";
                output.msg += "----------------------------------------\n";
                let errLines = stderr.replaceAll(inputDirectory+"/","").split("\n");
                for(let i=0; i<errLines.length; i++) {
                    if(errLines[i].includes("File \"main.py\", line")) {
                        let tokens = errLines[i].split(" ");
                        let lineNo = parseInt(tokens[tokens.length-1]) - 1;
                        errLines[i] = "  File \"main.py\", line " + lineNo + "\n";
                    }
                }
                output.msg += errLines.join('\n');
                output.msg += "----------------------------------------\n";
            }
        }
    }
}

// [Java] try to compile code block with asserts and run code
if(input["type"].startsWith("Java")) {
    // try to compile code block with asserts
    if(output["status"] === "ok") {
        let asserts = '';
        for(let a of input["asserts"])
            asserts += "if(" + a + ") {} else System.exit(-1);\n";
        java_src = java_src.replace("/*__ASSERTS__*/", asserts);
        //console.log(java_src);
        fs.writeFileSync(inputDirectory + "/Main.java", java_src);
        cmd = JAVA_COMPILER_PATH + " " + inputDirectory + "/Main.java";
        [status, stderr, stdout] = runBashCommand(cmd);
        fs.writeFileSync(inputDirectory + "/log-compile-code.txt", stderr);
        if(status != 0) {
            //console.log(stderr)
            output["status"] = "error";
            output.msg += getText("semantic_errors") + " " + getText("look_on_datatypes");
        }
    }
    // run code (max 10 seconds!)
    if(output["status"] === "ok") {
        cmd = "cd " + inputDirectory + " && " + JAVA_PATH + " Main";
        [status, stderr, stdout] = runBashCommand(cmd, 10*1000); // run max 10 seconds
        fs.writeFileSync(inputDirectory + "/log-run-code.txt", stderr);
        if(status != 0) {
            //console.log(status);
            output["status"] = "error";
            if(status == 143)
                output.msg += getText("not_terminating");
            else
                output.msg += getText("semantic_errors");
        }
    }
}

// [Python] run code block with asserts
if(input["type"].startsWith("Python")) {
    if(output["status"] === "ok") {
        let asserts = '';
        for(let a of input["asserts"])
            asserts += "if not(" + a + "):\n\tsys.exit(-1)\n";
        python_src = python_src.replace("#__ASSERTS__", asserts);
        //console.log(python_src);
        fs.writeFileSync(inputDirectory + "/main.py", python_src);
        cmd = PYTHON_PATH + " " + inputDirectory + "/main.py";
        [status, stderr, stdout] = runBashCommand(cmd, 10*1000); // run max 10 seconds
        fs.writeFileSync(inputDirectory + "/log-run-code-with-asserts.txt", stderr);
        if(status != 0) {
            //console.log(stderr)
            output["status"] = "error";
            if(status == 143)
                output.msg += getText("not_terminating");
            else
                output.msg += getText("semantic_errors_python") + " " + getText("look_on_identifiers");
        }
    }
}

// print output
console.log(JSON.stringify(output, null, 4));
