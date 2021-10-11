// TODO: header, copyright, ...

import * as fs from "fs";
import * as os from "os";

import { exec, execSync } from "child_process";

const JAVA_PATH = "/usr/bin/java";
const JAVA_COMPILER_PATH = "/usr/bin/javac";

function run_bash_command(cmd) {
    let res_status=0, res_stdout="", res_stderr="";

    try {
        res_stdout = execSync(cmd).toString();
    } catch(error) {
        res_status = error.status;
        res_stderr = error.stderr.toString();
        res_stdout = error.stdout.toString();
    }
    return [res_status, res_stderr, res_stdout];
}

let input_json = fs.readFileSync("services/examples/ex1.json");
let input = JSON.parse(input_json);

// create a temporary path for code execution:
let tmp_path = fs.mkdtempSync(os.tmpdir()).toString();

const JAVA_MAIN_TEMPLATE = `public class Main {
public static void main(String[] args) {
__MAIN__
}}`;

let cmd, status, stdout, stderr, java_src, java_main_src;

// 1. try to compile code block without asserts
java_main_src = input["source"] + "\n";
java_src = JAVA_MAIN_TEMPLATE.replace("__MAIN__", java_main_src);
//console.log(java_src);
fs.writeFileSync(tmp_path + "/Main.java", java_src);
cmd = JAVA_COMPILER_PATH + " " + tmp_path + "/Main.java";
[status, stderr, stdout] = run_bash_command(cmd);
if(status != 0) {
    console.log("Der Code enthält Syntaxfehler. Hinweise:\n");
    console.log("----------------------------------------");
    console.log(stderr.replaceAll(tmp_path+"/",""));
    // TODO: need to adjust line numbers!!
    console.log("----------------------------------------");
    process.exit(-1);
}

// 2. try to compile code block with asserts
java_main_src = input["source"] + "\n";
for(let a of input["asserts"]) {
    java_main_src += "if(" + a + ") {} else System.exit(-1);\n";
}
java_src = JAVA_MAIN_TEMPLATE.replace("__MAIN__", java_main_src);
//console.log(java_src);
fs.writeFileSync(tmp_path + "/Main.java", java_src);
cmd = JAVA_COMPILER_PATH + " " + tmp_path + "/Main.java";
[status, stderr, stdout] = run_bash_command(cmd);
if(status != 0) {
    console.log("Der Code enthält noch Fehler. Schauen Sie sich die Datentypen noch einmal an.\n");
    process.exit(-1);
}

// 3. run code (max 10 seconds!)
// TODO: RUN MAX 10 SECS!!!!!
cmd = JAVA_PATH + " " + tmp_path + "/Main.java";
[status, stderr, stdout] = run_bash_command(cmd);
if(status != 0) {
    console.log("Der Code enthält noch inhaltliche Fehler.\n");
    process.exit(-1);
}

// remove temporary path
fs.rmSync(tmp_path, { recursive: true });

/* TODO: 
  - temp path is not always removed
  - output JSON
  - write service.php
*/
