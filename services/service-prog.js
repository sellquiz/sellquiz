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
import * as os from "os";

import { execSync } from "child_process";

if(process.argv.length != 3) {
    console.log("usage: node service-prog.js JSON_INPUT_FILE");
    console.log("example: node servce-proj.js services/examples/ex1.json");
    process.exit(-1)
}

const inputPath = process.argv[2];

const JAVA_PATH = "/usr/bin/java";
const JAVA_COMPILER_PATH = "/usr/bin/javac";

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

// create a temporary path for code execution:
let tmp_path = fs.mkdtempSync(os.tmpdir()).toString();

const JAVA_MAIN_TEMPLATE = `public class Main {
__METHODS__
public static void main(String[] args) {
__MAIN__
}}`;

let cmd="", status="", stdout="", stderr="", java_src="", java_main_src="";

let output = {"status": "ok", "msg": ""};

// 1. try to compile code block without asserts
if(output["status"] === "ok") {
    switch(input["type"]) {
        case "JavaBlock":
            java_src = JAVA_MAIN_TEMPLATE.replace("__MAIN__", input["source"] + "\n");
            java_src = java_src.replace("__METHODS__", "");
            break;
        case "JavaMethod":
            java_src = JAVA_MAIN_TEMPLATE.replace("__MAIN__", "");
            java_src = java_src.replace("__METHODS__", input["source"] + "\n");
            break;
        default:
            output["status"] = "devError";
            output["msg"] = "unknown input type '" + input["type"] + "'!";
            console.log(JSON.stringify(output, null, 4));
            process.exit(-1);
    }
    //console.log(java_src);
    fs.writeFileSync(tmp_path + "/Main.java", java_src);
    cmd = JAVA_COMPILER_PATH + " " + tmp_path + "/Main.java";
    [status, stderr, stdout] = runBashCommand(cmd);
    if(status != 0) {
        output["status"] = "error";
        output.msg += "Der Code enthält Syntaxfehler. Hinweise:\n";
        output.msg += "----------------------------------------\n";
        let errLines = stderr.replaceAll(tmp_path+"/","").split("\n");
        // adjust line numbers
        for(let i=0; i<errLines.length; i++) {
            if(errLines[i].startsWith("Main.java:")) {
                let lineNo = parseInt(errLines[i].substr(10)) - 3; // TODO: constant 3 only valid for type "JavaBlock"
                let j = 10;
                for(; j<errLines[i].length; j++) {
                    if(errLines[i][j] == ':')
                        break;
                }
                errLines[i] = errLines[i].substr(0, 10) + lineNo 
                    + errLines[i].substr(j);
            }
        }
        output.msg += errLines.join('\n');
        output.msg += "----------------------------------------\n";
    }
}

// 2. try to compile code block with asserts
if(output["status"] === "ok") {

    TODO: XXXXX

    java_main_src = input["source"] + "\n";
    for(let a of input["asserts"]) {
        java_main_src += "if(" + a + ") {} else System.exit(-1);\n";
    }
    java_src = JAVA_MAIN_TEMPLATE.replace("__MAIN__", java_main_src);
    java_src = java_src.replace("__METHODS__", "");
    //console.log(java_src);
    fs.writeFileSync(tmp_path + "/Main.java", java_src);
    cmd = JAVA_COMPILER_PATH + " " + tmp_path + "/Main.java";
    [status, stderr, stdout] = runBashCommand(cmd);
    if(status != 0) {
        //console.log(stderr)
        output["status"] = "error";
        output.msg += "Der Code lässt sich zwar kompilieren, enthält aber noch inhaltliche Fehler. Schauen Sie sich z.B. die Datentypen noch einmal an, oder ob Ihr Programm überhaupt terminiert.\n";
    }
}

// 3. run code (max 10 seconds!)
if(output["status"] === "ok") {
    cmd = JAVA_PATH + " " + tmp_path + "/Main.java";
    [status, stderr, stdout] = runBashCommand(cmd, 10*1000); // run max 10 seconds
    if(status != 0) {
        console.log(status);
        output["status"] = "error";
        if(status == 143)
            output.msg += "Ihr Progamm terminiert nicht!\n";
        else
            output.msg += "Der Code lässt sich zwar kompilieren, enthält aber noch inhaltliche Fehler.\n";
    }
}

// remove temporary path
fs.rmSync(tmp_path, { recursive: true });

console.log(JSON.stringify(output, null, 4));
