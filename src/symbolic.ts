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

// this file implements math functions that are NOT provided by math.js

import * as math from 'mathjs';

export class SellSymTermElement {

    type : string;  // "var", "const", "uniop", "binop", "fct1", "fct2";   TUDO: enum!
    v : any;
    deriv : SellSymTermElement;

    constructor(type : string, v : any) {
        this.type = type;
        this.v = v;
        this.deriv = null;
    }

}

export class SellSymTerm {

    symbolIDs : Array<String>;
    stack : Array<SellSymTermElement>;
    state : string; // TODO: enum
    contains_forbidden_ode_subtree : boolean;

    constructor(symbolIDs=[]) {
        this.symbolIDs = symbolIDs;
        this.stack = [];
        this.state = ""; // e.g. "syntax-error"
        this.contains_forbidden_ode_subtree = false;
    }

    clear() {
        this.stack = [];
    }

    importTerm(str : string) : boolean {
        let n = math.parse(str);
        return this.importMathJsTermJsRecursively(n);
    }

    importMathJsTermJsRecursively(node) {
        // TODO: this is incomplete...
        switch (node.type) {
            case "ConstantNode":
                this.pushConstant(node.value);
                break;
            case "SymbolNode":
                this.pushVariable(node.name);
                break;
            case "OperatorNode":
            case "ParenthesisNode":
                while (node.type == "ParenthesisNode")
                    node = node.content;
                if (node.fn == "unaryMinus") {
                    if (this.importMathJsTermJsRecursively(node.args[0]) == false)
                        return false;
                    this.pushUnaryOperation("-");
                }
                else if (node.op == "+" || node.op == "-" || node.op == "*" || node.op == "/" || node.op == "^") {
                    if (this.importMathJsTermJsRecursively(node.args[0]) == false)
                        return false;
                    if (this.importMathJsTermJsRecursively(node.args[1]) == false)
                        return false;
                    this.pushBinaryOperation(node.op);
                } else {
                    console.log("warning: SellSymTerm::importMathJsTermJsRecursively(..): unknown/unimplemented operation " + node.op);
                    return false;
                }
                break;
            case "FunctionNode":
                if (node.name == "exp" || node.name == "sin" || node.name == "cos" || node.name == "sqrt") {
                    if (this.importMathJsTermJsRecursively(node.args[0]) == false)
                        return false;
                    this.pushUnaryFunction(node.name);
                } else {
                    console.log("warning: SellSymTerm::importMathJsTermJsRecursively(..): unknown/unimplemented function " + node.name);
                    return false;
                }
                break;
            default:
                console.log("warning: SellSymTerm::importMathJsTermJsRecursively(..): unknown/unimplemented node type " + node.type);
                return false;
        }
        return true;
    }

    pushVariable(id) {
        this.stack.push(new SellSymTermElement("var", id));
    }

    pushOdeFunction(f) {
        this.stack.push(new SellSymTermElement("ode_fun", f));
    }

    pushConstant(v) {
        v = parseFloat(v)
        this.stack.push(new SellSymTermElement("const", v));
    }

    pushSymbolicTerm(st) {
        if (st.stack.length == 0)
            this.stack.push(new SellSymTermElement("const", 0));
        else
            this.stack.push(st.stack[0]);
    }

    pushUnaryFunction(name) {
        let param = this.stack.pop();
        this.stack.push(new SellSymTermElement("fct1", [name, param]));
    }

    pushBinaryFunction(name) {
        let param2 = this.stack.pop();
        let param1 = this.stack.pop();
        this.stack.push(new SellSymTermElement("fct2", [name, param1, param2]));
    }

    pushDiff() {
        // TODO: must check, if following variables are "OK"...
        let diffVar = this.stack.pop();
        let diffFct = this.stack.pop();
        let term = new SellSymTerm();
        term.symbolIDs = this.symbolIDs; // TODO: copy?
        term.stack.push(diffFct); // TODO: copy?
        let diff = term.derivate(diffVar.v);
        this.pushSymbolicTerm(diff);
    }

    pushUnaryOperation(type) {
        let op = this.stack.pop();
        this.stack.push(new SellSymTermElement("uniop", [type, op]))
    }

    pushBinaryOperation(type) {
        type = type.replace("add", "+").replace("sub", "-").replace("mul", "*").replace("div", "/").replace("pow", "^");
        let op2 = this.stack.pop();
        let op1 = this.stack.pop();
        if (op1.type == "const" && op2.type == "const") {
            let res : any;
            res = 0;
            switch (type) {
                case "+": res = op1.v + op2.v; break;
                case "-": res = op1.v - op2.v; break;
                case "*": res = op1.v * op2.v; break;
                case "/": res = op1.v / op2.v; break;
                case "^": res = math.pow(op1.v, op2.v); break;
                default:
                    alert("unimplemented: SellSymTerm:pushBinaryOperation(..): operator " + type);
            }
            this.stack.push(new SellSymTermElement("const", res));
        }
        else {
            this.stack.push(new SellSymTermElement("binop", [type, op1, op2]));
        }
    }

    appendVariableSet(v, v_new) {
        for (let i = 0; i < v_new.length; i++) {
            let found = false;
            for (let j = 0; j < v.length; j++) {
                if (v_new[i] === v[j]) {
                    found = true;
                    break;
                }
            }
            if (found == false) {
                v.push(v_new[i]);
            }
        }
    }

    getVariables(element = null) {
        let v = [], v1, v2;
        if (element == null) {
            element = this.stack[0];
        }
        switch (element.type) {
            case "var":
                //v.push(element.v);
                this.appendVariableSet(v, [element.v]);
                break;
            case "const":
                break;
            case "uniop":
                v1 = this.getVariables(element.v[1]);
                this.appendVariableSet(v, v1);
                break;
            case "binop":
                v1 = this.getVariables(element.v[1]);
                this.appendVariableSet(v, v1);
                v2 = this.getVariables(element.v[2]);
                this.appendVariableSet(v, v2);
                break;
            case "ode_fun":
                this.appendVariableSet(v, [element.v]);
                //element.mathsymbol_ids // TODO: mathsymbol_ids relevant??
                break;
            case "fct1":
                v1 = this.getVariables(element.v[1]);
                this.appendVariableSet(v, v1);
                break;
            case "fct2":
                v1 = this.getVariables(element.v[1]);
                this.appendVariableSet(v, v1);
                v2 = this.getVariables(element.v[2]);
                this.appendVariableSet(v, v2);
                break;
            default:
                alert("unimplemented: SellSymTerm:getVariables(..): " + element.type);
        }
        return v;
    }

    getOdeOrder(element = null) {
        // TODO: does not work for PDE!!
        let o = 0;
        let root = false;
        if (element == null) {
            root = true;
            element = this.stack[0];
        }
        switch (element.type) {
            case "uniop":
                o = math.max(o, this.getOdeOrder(element.v[1]));
                break;
            case "binop":
                o = math.max(o, this.getOdeOrder(element.v[1]));
                o = math.max(o, this.getOdeOrder(element.v[2]));
                break;
            case "fct2":
                if (element.v[0] == "diff_ode")
                    o = math.max(o, 1);
                else if (element.v[0] == "diff2_ode")
                    o = math.max(o, 2);
                break;
        }
        return o;
    }

    optimizeOdeConstants(element = null) {
        let root = false;
        let e, e1, e2;
        if (element == null) {
            root = true;
            element = this.stack[0];
        }
        switch (element.type) {
            case "var":
                break;
            case "uniop":
                this.optimizeOdeConstants(element.v[1]);
                e = element.v[1];
                if(e.type === "var" && e.v.startsWith("C")) {
                    element.type = "var";
                    element.v = e.v;
                }
                break;
            case "binop":
                this.optimizeOdeConstants(element.v[1]);
                this.optimizeOdeConstants(element.v[2]);
                e1 = element.v[1];
                e2 = element.v[2];
                if(e1.type === "var" && e1.v.startsWith("C") && e2.type === "const") {
                    element.type = "var";
                    element.v = e1.v;
                }
                else if(e2.type === "var" && e2.v.startsWith("C") && e1.type === "const") {
                    element.type = "var";
                    element.v = e2.v;
                }
                break;
            case "fct1":
                this.optimizeOdeConstants(element.v[1]);
                e = element.v[1];
                if(e.type === "var" && e.v.startsWith("C")) {
                    element.type = "var";
                    element.v = e.v;
                }
                break;
        }
    }

    searchForForbiddenODESecondOrderSubterms(element = null) {
        let v = [], v1, v2;
        if (element == null) {
            element = this.stack[0];
        }
        switch (element.type) {
            case "var":
                //v.push(element.v);
                this.appendVariableSet(v, [element.v]);
                break;
            case "const":
                break;
            case "uniop":
                v1 = this.searchForForbiddenODESecondOrderSubterms(element.v[1]);
                this.appendVariableSet(v, v1);
                break;
            case "binop":
                v1 = this.searchForForbiddenODESecondOrderSubterms(element.v[1]);
                this.appendVariableSet(v, v1);
                v2 = this.searchForForbiddenODESecondOrderSubterms(element.v[2]);
                this.appendVariableSet(v, v2);
                break;
            case "ode_fun":
                this.appendVariableSet(v, [element.v]);
                //element.mathsymbol_ids // TODO: mathsymbol_ids relevant??
                break;
            case "fct1":
                v1 = this.searchForForbiddenODESecondOrderSubterms(element.v[1]);
                this.appendVariableSet(v, v1);
                break;
            case "fct2":
                v1 = this.searchForForbiddenODESecondOrderSubterms(element.v[1]);
                this.appendVariableSet(v, v1);
                v2 = this.searchForForbiddenODESecondOrderSubterms(element.v[2]);
                this.appendVariableSet(v, v2);
                break;
            default:
                alert("unimplemented: SellSymTerm:searchForForbiddenODESecondOrderSubterms(..): " + element.type);
        }
        console.log("TEST:");
        console.log(v);
        if(v.length == 2) {
            this.contains_forbidden_ode_subtree = true;
            for(let i=0; i<v.length; i++) {
                if(v[i].startsWith("C") == false)
                    this.contains_forbidden_ode_subtree = false;
            }
        }
        return v;
    }

    getOperator(element) {
        let op = "";
        if (element.type == "uniop" || element.type == "binop")
            op = element.v[0];
        return op;
    }

    getOperatorPrecedence(op) {
        let p = 0;
        switch (op) {
            case "+": p = 10; break;
            case "-": p = 10; break; // TODO: this was 11
            case "*": p = 20; break;
            case "/": p = 20; break; // TODO: this was 21
            case "^": p = 30; break;
            case "": p = 99; break
            default:
                alert("unimplemented: SellSymTerm:getOperatorPrecedence(..): op=" + op);
        }
        return p;
    }

    toString(element = null) : string {
        let s = "";
        let root = false;
        if (element == null) {
            root = true;
            element = this.stack[0];
        }
        let name, arg, arg1, arg2;
        switch (element.type) {
            case "var":
                s = element.v;
                break;
            case "const":
                s = element.v.toString();
                if (math.abs(element.v - 3.141592653589793) < 1e-12)
                    s = "pi";
                break;
            case "uniop":
                s = element.v[0] + this.toString(element.v[1]);
                if (element.v[1].type == 'uniop')
                    s = "(" + s + ")";
                break;
            case "ode_fun":
                /*if(element.v[0].type === "function")
                    s = element.value.toString();
                else*/
                s = element.v.id + "(" + element.v.mathsymbol_ids[0] + ")";
                break;
            case "binop":
                let c1 = this.toString(element.v[1]);
                let c2 = this.toString(element.v[2]);
                let op = element.v[0];
                let op_precedence = this.getOperatorPrecedence(op);
                let op1 = this.getOperator(element.v[1]);
                let op1_precedence = this.getOperatorPrecedence(op1);
                let op2 = this.getOperator(element.v[2]);
                let op2_precedence = this.getOperatorPrecedence(op2);
                
                if (op1_precedence < op_precedence)
                    c1 = "(" + c1 + ")";
                else if (op === "/")
                    c1 = "(" + c1 + ")";

                if (op2_precedence < op_precedence /*|| op2.type == 'uniop'*/)
                    c2 = "(" + c2 + ")";
                else if (c2.startsWith("-"))
                    c2 = "(" + c2 + ")";
                else if (op === "-" || op === "/") {
                    if(element.v[2].type !== "const")
                        c2 = "(" + c2 + ")";
                }

                s = c1 + op + c2;
                break;
            case "fct1":
                name = element.v[0];
                arg = this.toString(element.v[1]);
                if (name === "exp" && arg.length < 5)
                    s = "e^(" + arg + ")";
                else
                    s = name + "(" + arg + ")";
                break;
            case "fct2":
                name = element.v[0];
                if (name === "diff_ode") {
                    // TODO: should now work, since we have "diff2_ode"
                    /*// TODO: this is yet only statically implemented for second order, as well as nested differentials with the same derivative variable
                    //alert(element.v.length)
                    if(element.v[1].v.type == "function")
                        s = element.v[1].v.value.stack[0].v[1].v.id + "''(" + element.v[2].v + ")";
                    else*/
                    s = element.v[1].v.id + "'(" + element.v[2].v + ")";
                }
                else if (name === "diff2_ode") {
                    s = element.v[1].v.id + "''(" + element.v[2].v + ")";
                }
                else {
                    arg1 = this.toString(element.v[1]);
                    arg2 = this.toString(element.v[2]);
                    s = name + "(" + arg1 + ", " + arg2 + ")";
                }
                break;
            default:
                alert("unimplemented: SellSymTerm:toString(..): " + element.type);
        }
        if (root && s.startsWith("(")) {
            s = s; //  s.substr(1, s.length-2); TODO
        }
        return s;
    }

    derivate(variable/*id*/, element = null) {
        let u, v, op, name, p1;
        let isRoot = element == null;
        if (isRoot)
            element = this.stack[0];
        switch (element.type) {
            case "var":
                element.deriv = new SellSymTermElement("const", element.v == variable ? 1 : 0);
                break;
            case "const":
                element.deriv = new SellSymTermElement("const", 0);
                break;
            case "uniop":
                u = element.v[1];
                this.derivate(variable, u);
                op = element.v[0];
                switch (op) {
                    case "-":
                        // f = - u
                        // f' = - u'
                        element.deriv =
                            new SellSymTermElement("uniop", [op, u.deriv]);
                        break;
                    default:
                        alert("unimplemented: SellSymTerm:derivate(..): uniop: " + op);
                }
                break;
            case "binop":
                u = element.v[1];
                this.derivate(variable, u);
                v = element.v[2];
                this.derivate(variable, v);
                op = element.v[0];
                switch (op) {
                    case "+":
                    case "-":
                        // f  = u + v
                        // f' = u' + v'
                        element.deriv =
                            new SellSymTermElement("binop", [op, u.deriv, v.deriv]);
                        break;
                    case "*":
                        // f  = u * v
                        // f' = u'*v + v'*u
                        element.deriv =
                            new SellSymTermElement("binop", ["+",
                                new SellSymTermElement("binop", ["*", u.deriv, v]),
                                new SellSymTermElement("binop", ["*", v.deriv, u])
                            ]);
                        break;
                    case "/":
                        // f  = u / v
                        // f' = (u'*v - v'*u) / v^2
                        element.deriv =
                            new SellSymTermElement("binop", ["/",
                                new SellSymTermElement("binop", ["-",
                                    new SellSymTermElement("binop", ["*", u.deriv, v]),
                                    new SellSymTermElement("binop", ["*", v.deriv, u])
                                ]),
                                new SellSymTermElement("binop", ["*", v, v])
                            ]);
                        break;
                    case "^":
                        // f  = u^v (assuming v is const)
                        // f' = u' * v * u^(v-1)
                        if (v.type !== "const")
                            alert("unimplemented: SellSymTerm:derivate(..): derivation of u^v with v != const")
                        element.deriv =
                            new SellSymTermElement("binop", ["*",
                                u.deriv,
                                new SellSymTermElement("binop", ["*",
                                    v,
                                    new SellSymTermElement("binop", ["^",
                                        u,
                                        new SellSymTermElement("binop", ["-",
                                            v,
                                            new SellSymTermElement("const", 1)
                                        ])
                                    ])
                                ])
                            ]);
                        break;
                    default:
                        alert("unimplemented: SellSymTerm:derivate(..): binop: " + op);
                }
                break;
            case "fct1":
                name = element.v[0];
                p1 = element.v[1];
                this.derivate(variable, p1);
                switch (name) {
                    case "sin":
                        // f = sin(p1)
                        // f' = p1' * cos(p1)
                        element.deriv =
                            new SellSymTermElement("binop", ["*",
                                p1.deriv,
                                new SellSymTermElement("fct1", ["cos", p1])
                            ]);
                        break;
                    case "cos":
                        // f = cos(p1)
                        // f' = - p1' * sin(p1)
                        element.deriv =
                            new SellSymTermElement("uniop", ["-",
                                new SellSymTermElement("binop", ["*",
                                    p1.deriv,
                                    new SellSymTermElement("fct1", ["sin", p1])
                                ])
                            ]);
                        break;
                    case "exp":
                        // f  = exp(p1)
                        // f' = p1' * exp(p1)
                        element.deriv =
                            new SellSymTermElement("binop", ["*",
                                p1.deriv,
                                new SellSymTermElement("fct1", ["exp", p1])
                            ]);
                        break;
                    case "sqrt":
                        // f  = sqrt(p1) = p1^(0.5)
                        // f' = p1' / (2*sqrt(p1))
                        element.deriv =
                            new SellSymTermElement("binop", ["/",
                                p1.deriv,
                                new SellSymTermElement("binop", ["*",
                                    new SellSymTermElement("const", 2),
                                    new SellSymTermElement("fct1", ["sqrt", p1])
                                ])
                            ]);
                        break;
                    default:
                        alert("unimplemented: SellSymTerm:derivate(..): fct1: " + name);
                }
                break;
            default:
                alert("unimplemented: SellSymTerm:derivate(..): " + element.type);
        }
        if (isRoot) {
            let t = new SellSymTerm();
            t.symbolIDs = this.symbolIDs;
            t.stack = [this.stack[0].deriv];
            t.optimize();
            return t;
        }
        else
            return null;
    }

    eval(var_values/*dict*/, element = null) {
        let res : any, u, v, op, name, param, param1, param2;
        res = 0;
        if (element == null)
            element = this.stack[0];
        switch (element.type) {
            case "var":
                if (element.v in var_values) {
                    res = parseFloat(var_values[element.v]);
                } else {
                    alert("SellSymTerm:eval(..): variable " + element.v + " has no value!");
                    return 0;
                }
                break;
            case "const":
                res = element.v;
                break;
            case "uniop":
                u = this.eval(var_values, element.v[1]);
                op = element.v[0];
                switch (op) {
                    case "-": res = - u; break;
                    default:
                        alert("unimplemented: SellSymTerm:eval(..): uniop: " + op);
                }
                break;
            case "binop":
                u = this.eval(var_values, element.v[1]);
                v = this.eval(var_values, element.v[2]);
                op = element.v[0];
                switch (op) {
                    case "+": res = u + v; break;
                    case "-": res = u - v; break;
                    case "*": res = u * v; break;
                    case "/": res = u / v; break;
                    case "^": res = math.pow(u, v); break;
                    default:
                        alert("unimplemented: SellSymTerm:eval(..): binop: " + op);
                }
                break;
            case "fct1":
                name = element.v[0];
                param = this.eval(var_values, element.v[1]);
                switch (name) {
                    case "sin": res = math.sin(param); break;
                    case "cos": res = math.cos(param); break;
                    case "exp": res = math.exp(param); break;
                    case "sqrt": res = math.sqrt(param); break;
                    default:
                        alert("unimplemented: SellSymTerm:eval(..): fct1: " + name);
                }
                break;
            case "fct2":
                name = element.v[0];
                //param1 = this.eval(var_values, element.v[1]);
                //param2 = this.eval(var_values, element.v[2]);
                switch (name) {
                    case "diff_ode":
                    case "diff2_ode":
                        let t = null;
                        let t_id = element.v[1].v.id;
                        if (t_id in var_values)
                            t = var_values[t_id];
                        else
                            alert("SellSymTerm:eval(..): unknown term " + t_id);
                        let t_deriv_var_id = element.v[2].v;
                        let t_deriv = t.derivate(t_deriv_var_id);
                        if (name === "diff2_ode")
                            t_deriv = t_deriv.derivate(t_deriv_var_id);
                        res = t_deriv.eval(var_values);
                        // TODO: (update): should now work: following can be deleted!
                        // TODO: THIS CODE MUST BE REWRITTEN, AS IT IS VERY STATIC
                        // AND ONLY SUPPORTS  diff(y, x) and diff(diff(y,x), x)!!!!!
                        /*let order = 1;
                        if(element.v[1].v.type === "function")
                            order = 2;
                        t = var_values["y"]; // TODO!!
                        let t_deriv_var_id = element.v[2].v;
                        let t_deriv = t.derivate(t_deriv_var_id);
                        if(order == 2)
                            t_deriv = t_deriv.derivate(t_deriv_var_id);
                        res = t_deriv.eval(var_values);
                        /*if(element.v[1].v.type === "function") {
                            t = element.v[1].v.value;
                            order = 2;
                        } else {
                            let t_id = element.v[1].v.id;
                            if(t_id in var_values)
                                t = var_values[t_id];
                            else
                                alert("SellSymTerm:eval(..): unknown term " + t_id);
                        }
                        let t_deriv_var_id = element.v[2].v;
                        let t_deriv = t.derivate(t_deriv_var_id);
                        res = t_deriv.eval(var_values);*/
                        break;
                    default:
                        alert("unimplemented: SellSymTerm:eval(..): fct1: " + name);
                }
                break;
            case "ode_fun":
                let t_id = element.v.id;
                let t = null;
                if (t_id in var_values)
                    t = var_values[t_id];
                else
                    alert("SellSymTerm:eval(..): unknown term " + t_id);
                res = t.eval(var_values);
                break;
            default:
                alert("unimplemented: SellSymTerm:eval(..): " + element.type);
        }
        return res;
    }

    optimize(element = null) {
        let op, u, v;
        let isRoot = element == null;
        if (isRoot)
            element = this.stack[0];
        if (element.type === "uniop") {
            op = element.v[0];
            u = this.optimize(element.v[1]);
            element.v[1] = u; // TODO: this was commented out (why??)
            if (op === "-" && u.type == "const" && u.v == 0) {
                element.type = "const";
                element.v = 0;
            }
        }
        else if (element.type === "fct1") {
            u = this.optimize(element.v[1]);
            element.v[1] = u; // TODO: this was commented out (why??)
        }
        else if (element.type === "binop") {
            op = element.v[0];
            u = this.optimize(element.v[1]);
            element.v[1] = u; // TODO: this was commented out (why??)
            v = this.optimize(element.v[2]);
            element.v[2] = v; // TODO: this was commented out (why??)
            // calculate constant term
            if (u.type === "const" && v.type === "const") {
                //console.log('***')
                //console.log(u.v)
                //console.log(v.v)
                element.type = "const";
                switch (op) {
                    case "+": element.v = u.v + v.v; break;
                    case "-": element.v = u.v - v.v; break;
                    case "*": element.v = u.v * v.v; break;
                    case "/": element.v = u.v / v.v; break;
                    default:
                        alert("unimplemented: SellSymTerm:optimize(..): binop: " + op);
                }
                //console.log(element)
            }
            // 0, if u or v zero
            else if (op === "*" && ((u.type === "const" && u.v == 0) || (v.type === "const" && v.v == 0))) {
                element.type = "const";
                element.v = 0;
            }
            // 1 * v = v
            else if (op === "*" && (u.type === "const" && u.v == 1)) {
                element.type = v.type;
                element.v = v.v;
            }
            // (-1) * v = -v
            else if (op === "*" && (u.type === "const" && u.v == -1)) {
                element = new SellSymTermElement("uniop", ["-", v]);
            }
            // u * 1 = u
            else if (op === "*" && (v.type === "const" && v.v == 1)) {
                element.type = u.type;
                element.v = u.v;
            }
            // u * (-1) = -u
            else if (op === "*" && (v.type === "const" && u.v == -1)) {
                element = new SellSymTermElement("uniop", ["-", u]);
            }
            // 0 + v = v
            else if (op === "+" && (u.type === "const" && u.v == 0)) {
                element.type = v.type;
                element.v = v.v;
            }
            // u + 0 = u
            else if (op === "+" && (v.type === "const" && v.v == 0)) {
                element.type = u.type;
                element.v = u.v;
            }
            // u - 0 = u
            else if (op === "-" && (v.type === "const" && v.v == 0)) {
                element.type = u.type;
                element.v = u.v;
            }
            // u^1 = u
            else if (op === "^" && (v.type === "const" && v.v == 1)) {
                element.type = u.type;
                element.v = u.v;
            }
            // u - (-v) = u + v
            else if (op === "-" && v.type === "uniop" && v.v[0] === "-") {
                element = new SellSymTermElement("binop", ["+", u, v.v[1]]);
            }
            // u + (-v) = u - v
            else if (op === "+" && v.type === "uniop" && v.v[0] === "-") {
                element = new SellSymTermElement("binop", ["-", u, v.v[1]]);
            }
        }
        if (isRoot) {
            this.stack[0] = element;
            //console.log('yyyyy')
            //console.log(this.toString(element))
            //console.log(element.v)
        }
        return element;
    }

    integrateNumerically(varId, a, b) {
        if(b < a)
            return - this.integrateNumerically(varId, b, a);
        const steps = 1e6; // TODO: configure
        // TODO: must check if all variables are set!! -> error handling!!
        let h = (b-a) / steps;
        let res = 0;
        for(let x=a; x<b; x+=h) {
            let f1 = this.eval({ varId: x });
            let f2 = this.eval({ varId: x+h });
            res += (f1+f2)/2 * h;
        }
        return res;
    }

    compareWithStringTerm(t, listOfSymbols = []) {
        // listOfSymbols is an optional list of symbols that could be present in string input t

        this.state = "";

        if (t.length == 0)
            t = "0";

        let vars = this.getVariables(); // actually needed variables
        if (listOfSymbols.length > 0)
            vars = listOfSymbols;

        const n = 50 // TODO: configure number of tests

        const l = -1 // TODO: configure lower bound for EACH variable IN SYNTAX
        const u = 1 // TODO: configure upper bound for EACH variable IN SYNTAX

        let epsilon = 1e-6; // TODO: configure espilon

        for (let i = 0; i < n; i++) {
            let scope = {};
            for (let j = 0; j < vars.length; j++)
                scope[vars[j]] = math.random(l, u);
//console.log("scope")
//console.log(scope)
//console.log("t")
//console.log(t)
            let res = this.eval(scope);
            if(res > 1000.0) { // too large values (e.g. due to exp(x)) are numerically instable: skip them!
                i --;  // TODO: can result infinite loops!
                continue;
            }
            let t_res = 0;
            try {
                t_res = math.evaluate(t, scope);
            } catch (e) {
                this.state = "syntaxerror";
                return false;
            }
            if(typeof(t_res) !== 'number') {
                this.state = "syntaxerror";
                return false;
            }
//console.log(res + " vs " + t_res)
//console.log("type of res and type of tres: " + typeof(res) + ", " + typeof(t_res) );
            if (math.abs(res - t_res) >= epsilon)
                return false;
        }

        return true;
    }
}

export class SellSymTerm_Matrix {

    m : number;
    n : number;
    elements : Array<SellSymTerm>;

    constructor(m : number, n : number, elements=[]) {
        this.m = m;
        this.n = n;
        this.elements = elements;
    }

    toString() {
        let s = '[';
        for(let i=0; i<this.m; i++) {
            if(i > 0)
                s += ', ';
            s += '[';
            for(let j=0; j<this.n; j++) {
                if(j > 0)
                    s += ', ';
                s += this.elements[i*this.n + j].toString();
            }
            s += ']';
        }
        s += ']';
        return s;
    }

}
