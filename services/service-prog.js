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

// TODO: support both "de" and "en" as languages! (JSON-input should have a "language" property!)

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import { execSync } from "child_process";

if(process.argv.length != 3) {
    console.log("usage: node service-prog.js JSON_INPUT_FILE");
    console.log("example: node servce-proj.js services/examples/ex1.json");
    process.exit(-1)
}

const inputPath = process.argv[2];
const inputDirectory = path.dirname(inputPath);

const JAVA_PATH = "/usr/bin/java";
const JAVA_COMPILER_PATH = "/usr/bin/javac";

const text = {
    "empty_program_en": "You have submitted an empty program.",
    "empty_program_de": "Sie haben ein leeres Programm abgegeben.",
    "syntax_error_en": "Your code contains syntax errors. Hints:",
    "syntax_error_de": "Der Code enthält Syntaxfehler. Hinweise:",
    "semantic_errors_en": "Although the code can be compiled, it still contains errors in terms of content.",
    "semantic_errors_de": "Der Code lässt sich zwar kompilieren, enthält aber noch inhaltliche Fehler.",
    "look_on_datatypes_en": "Take a close look to see whether you have exactly adopted the prescribed data types and identifiers.",
    "look_on_datatypes_de": "Schauen Sie genau hin, ob Sie die vorgeschriebenen Datentypen und Bezeichner exakt übernommen haben.",
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

const JAVA_MAIN_TEMPLATE = `import java.util.*;public class Main {
/*__METHODS__*/
public static void main(String[] args) {
/*__MAIN__*/
/*__ASSERTS__*/
}}`;

let cmd="", status="", stdout="", stderr="", java_src="", java_main_src="";

let output = {"status": "ok", "msg": ""};

// 0. empty code?
if(input["source"].trim().length == 0) {
    output["status"] = "error";
    output["msg"] = getText("empty_program");
}

// 1. try to compile code block without asserts
if(output["status"] === "ok") {
    switch(input["type"]) {
        case "JavaBlock":
            java_src = JAVA_MAIN_TEMPLATE.replace("/*__MAIN__*/", input["source"] + "\n");
            break;
        case "JavaMethod":
            java_src = JAVA_MAIN_TEMPLATE.replace("/*__METHODS__*/", input["source"] + "\n");
            break;
        default:
            output["status"] = "devError";
            output["msg"] = "unknown input type '" + input["type"] + "'!";
            console.log(JSON.stringify(output, null, 4));
            process.exit(-1);
    }
    //console.log(inputDirectory + "/Main.java");
    //console.log(java_src);
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
                let lineNo = parseInt(errLines[i].substring(10)) - 3; // TODO: constant 3 only valid for type "JavaBlock"
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

// 2. try to compile code block with asserts
if(output["status"] === "ok") {
    let asserts = '';
    for(let a of input["asserts"]) {
        asserts += "if(" + a + ") {} else System.exit(-1);\n";
    }
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

// 3. run code (max 10 seconds!)
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

console.log(JSON.stringify(output, null, 4));
