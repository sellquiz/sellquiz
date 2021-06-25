sellquiz / [Exports](modules.md)

# SELL Quiz

The **Simple E-Learning Language (=: SELL)** is an **open standard for mathematical e-learning questions** with the following objectives:
* **Simple syntax:** No unneeded overhead. Defining a task/question should be similar to describe the task/question on a blackboard.
* **Expressive langage:** Programs are short and concise such that the semantics can be grasp quickly. Irrelevant detail is avoided.
* **Reuse of established standards:** We inherit [AsciiMath](http://asciimath.org) for mathematical expressions and [Markdown]() for text formatting.

Project website: https://sell.f07-its.fh-koeln.de/

Project maintainer: [Andreas Schwenk](https://www.th-koeln.de/personen/andreas.schwenk/) / [TH Köln](https://www.th-koeln.de). 

### Language Definition

SELL is domain-specific langague (DSL). Visit the [official website](https://sell.f07-its.fh-koeln.de/web/) for detailed information.

### Hello, World!

The following example demonstrates a question written in SELL.

```
Matrix Operations

	a := { 1, 2, 3 }
	A, C in MM( 2 x 1 | a )
	B in MM( 2 x 2 | a )
	D := (A + B^T * C)^T

Please calculate:
* $ (A + B^T * C)^T = #D $
```

[Click here to run the example](https://sell.f07-its.fh-koeln.de/2021-01-05/dist/index-offline.html)

### More Examples

You'll find a set of working examples (in German language) [here](https://sell.f07-its.fh-koeln.de/web/examples.php).
The corresponding SELL-code can be found in this repository in directory `/examples/`

# Usage

### Website Embedding:

Visit  https://github.com/sellquiz/sellquiz-standalone

### Moodle Plugin:

(work in progress. Please come back later)

### Ilias Plugin:

(work in progress. Please come back later)

# Developers

Run `npm install --production=false` to install developer-dependencies.

### Language Grammar

```
sell =
  title { code | text };
code =
  "§CODE_START" { (code_prop | code_hint | assign) "\n" } "§CODE_END";
code_prop =
  "input" ("rows"|"cols") ":=" ("resizeable"|"static");
code_hint =
  "?" text;
assign =
    ID {"," ID} (":="|"=") expr
  | ID {"," ID} "in" (matrix_def | set | expr)
  | ID "[" expr "," expr "]" (":="|"=") expr
  | ID "[" expr "," expr "]" "in" (matrix_def | set | expr)
  | ID "(" ID {"," ID} ")" (":="|"=") symbolic_term;
expr =
  or;
or =
  and [ "or" and ];
and =
  equal [ "and" equal ];
equal =
  compare [ ("=="|"!=") compare ];
compare =
  add [ ("<="|"<"|">="|">") add ];
add =
  mul { ("+"|"-") mul };
mul =
  pow { ("*"|"/"|"mod") pow };
pow =
  unary { ("^") unary };
unary = (
    "-" unary;
  | INT
  | "true" | "false"
  | "not" unary
  | "i" | "j" | "T"
  | function_call
  | ID
  | "..."
  | matrix
  | "(" expr ")"
) [ factorial ];
matrix =
  "[" "[" expr {"," expr} "]" { "," "[" expr {"," expr} "]" } "]";
function_call =
  ("abs"|"binomial"|"integrate"|"conj"|"sqrt"|"xgcd"|"det"|"rank"|"inv"
     |"eye"|"eigenvalues_sym"|"triu"|"sin"|"cos"|"asin"|"acos"|"tan"
     |"atan"|"norm2"|"dot"|"cross"|"linsolve"| "is_zero")
  ID "(" [ expr {"," expr} ] ")";
factorial =
  "!";
matrix_def =
  "MM" "(" expr "x" expr "|" expr [ {"," ("invertible"|"symmetric")} ] ")";
set =
  "{" [ expr { "," expr } ] "}";
symbolic_term =
  symbolic_term_add;
symbolic_term_expr =
  symbolic_term_add;
symbolic_term_add =
  symbolic_term_mul { ("+"|"-") symbolic_term_mul };
symbolic_term_mul =
  symbolic_term_pow { ("*"|"/") symbolic_term_pow };
symbolic_term_pow =
  symbolic_term_unary { "^" symbolic_term_unary };
symbolic_term_unary =
    "(" symbolic_term_expr ")"
  | INT ["!"]
  | FLOAT
  | ("exp"|"sin"|"cos") "(" symbolic_term_expr ")"
  | "diff" "(" symbolic_term_expr "," ID  ")"
  | ID
  | ID "(" [ expr { "," epxr } ] ")"
  | "-" symbolic_term_pow;
title =
  { ID | "#" ID | MISC } "\n";
text =
  { single_multiple_choice | itemize | inline_listing | listing
    | inline_math | im_input | ID | MISC };
itemize =
  "*";
single_multiple_choice =
    "(" ("x"|expr) ")"
  | "[" ("x"|expr) "]";
inline_listing =
  "`" { MISC } "`";
listing =
  "```" { MISC } "```";
inline_math =
  "$" { im_expr } "$";
im_expr =  /*similar to ASCII math*/
  im_list;
im_list =
  im_assign { (","|":"|"->"|"|->") } im_assign;
im_assign =
  im_other_binary_op "=" im_other_binary_op;
im_other_binary_op =
  im_relational { ("in"|"notin"|"uu"|"^^"|"vv"|"@") } im_relational;
im_relational =
  im_add { ("<"|"<="|">"|">="|"!=") im_add };
im_add =
  im_mul { ("+"|"-") im_mul };
im_mul =
  im_pow { ("*"|"/") im_pow };
im_pow =
  im_unary { "^" im_unary };
im_unary = (
    im_input
  | "text" "(" { MISC } ")"
  | "augmented" "(" ID "|" ID ")"
  | ("sum"|"prod"|"lim"|"int") [ "_" expr ] [ "^" expr ]
  | "RR" | "ZZ" | "QQ" | "CC"
  | "oo" | "infty"
  | "equiv" | "mod"
  | "EE" | "AA"
  | "dx" | "dy" | "dz"
  | "bar" im_unary
  | "-" unary
  | " "
  | INT | FLOAT
  | ID
  | ID "[" (INT|":") "," (INT|":") "]"
  | "\"" ID "\""
  | "(" im_expr ")"
  | "{" { im_expr } "}"
  | "|"
  | "\"
  | "\\"
  | "..."
  | im_matrix
) [ "!" | {"'"} ];
im_matrix =
    "["        "[" im_expr {"," im_expr} "]"
         { "," "[" im_expr {"," im_expr} "]" } "]";
  | "("        "(" im_expr {"," im_expr} "]"
         { "," "[" im_expr {"," im_expr} ")" } ")";
im_input =
  "#" [ "[" "diff" ID "]" ] (
      ID
    | "\"" (ID|INT) { "|" (ID|INT) } "\""    /* gap question text */
  );
```
