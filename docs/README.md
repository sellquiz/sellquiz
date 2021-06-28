sellquiz / [Exports](modules.md)

# SELL Quiz

The **Simple E-Learning Language (=: SELL)** is an **open standard for mathematical e-learning questions** with the following objectives:
* **Simple syntax:** No unneeded overhead. Defining a task/question should be similar to describe the task/question on a blackboard.
* **Expressive language:** Programs are short and concise such that the semantics can be grasped quickly. Irrelevant detail is avoided.
* **Reuse of established standards:** We inherit [AsciiMath](http://asciimath.org) for mathematical expressions and [Markdown]() for text formatting.

Project website: https://sell.f07-its.fh-koeln.de/

Project maintainer: [Andreas Schwenk](https://www.th-koeln.de/personen/andreas.schwenk/) / [TH Köln](https://www.th-koeln.de). 

### Language Definition

SELL is a domain-specific language (DSL). Visit the [official website](https://sell.f07-its.fh-koeln.de/web/) for detailed information.

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

You'll find a set of working examples (in the German language) [here](https://sell.f07-its.fh-koeln.de/web/examples.php).
The corresponding SELL-code can be found in this repository in directory `/examples/`

# Usage

### Website Embedding:

Visit  https://github.com/sellquiz/sellquiz-standalone

### Moodle Plugin:

(work in progress. Please come back later)

### Ilias Plugin:

(work in progress. Please come back later)

# Developers

- Run `npm install --production=false` to install developer-dependencies.
- Run `npm run build` to build the sellquiz-library.
- Open `src/index-highlevel.html` for a demonstration of the high-level API in the browser.
- Open `src/index-lowlevel.html` for a demonstration of the low-level API in the browser.
- You'll find a demonstration of the low-level API for Node.js in file `src/test-lowlevel-api.js`.

(We provide a VS Code launch configuration in `.code/launch.json`.)

## Functions

### autoCreateQuiz

▸ **autoCreateQuiz**(`sellCode`, `htmlDivElement`): `boolean`

Creates a quiz including HTML control elements. This function can be used for a trivial integration of a stand-alone SELL quiz into a website. WARNING: do not mix using this high-level function and low-level functions.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sellCode` | `string` | SELL source code of one or multiple questions (divided by a line equal to %%%) |
| `htmlDivElement` | `HTMLElement` | HTML element that will contain all questions. |

#### Returns

`boolean`

success.

#### Defined in

index.ts:31

___

### autoEvaluateQuiz

▸ **autoEvaluateQuiz**(`questionID`, `htmlQuestionElementID`): `boolean`

TODO: doc

#### Parameters

| Name | Type |
| :------ | :------ |
| `questionID` | `number` |
| `htmlQuestionElementID` | `string` |

#### Returns

`boolean`

#### Defined in

index.ts:52

___

### createQuestion

▸ **createQuestion**(`sellCode`): `number`

Creates a new question.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sellCode` | `string` | SELL source code of a single question. |

#### Returns

`number`

Question index or -1 in case of errors.

#### Defined in

index.ts:76

___

### disableInputFields

▸ **disableInputFields**(`questionID`): `boolean`

Disables all input field HTML elements for editing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

success.

#### Defined in

index.ts:178

___

### enableInputFields

▸ **enableInputFields**(`questionID`): `boolean`

Enables all input field HTML elements for editing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

success.

#### Defined in

index.ts:169

___

### evaluateQuestion

▸ **evaluateQuestion**(`questionID`): `boolean`

Evaluates the question and updates the question HTML element.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

success.

#### Defined in

index.ts:133

___

### getErrorLog

▸ **getErrorLog**(): `string`

Gets the error log for the last created question.

#### Returns

`string`

Error log.

#### Defined in

index.ts:86

___

### getFeedbackText

▸ **getFeedbackText**(`questionID`): `string`

Gets the feedback text of an already evaluated question.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question Index. |

#### Returns

`string`

success.

#### Defined in

index.ts:148

___

### getQuestionBody

▸ **getQuestionBody**(`questionID`): `string`

Gets the question body.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`string`

Body as HTML code or an empty string, if the question does not exist.

#### Defined in

index.ts:107

___

### getQuestionTitle

▸ **getQuestionTitle**(`questionID`): `string`

Gets the question title.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`string`

Title as HTML code or an empty string, if the question does not exist.

#### Defined in

index.ts:95

___

### getScore

▸ **getScore**(`questionID`): `number`

Gets the evaluation score of an already evaluted question.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Gets |

#### Returns

`number`

score in range [0, 1]

#### Defined in

index.ts:160

___

### refreshMatrixDimensions

▸ **refreshMatrixDimensions**(`questionID`, `matrixId`, `deltaRows`, `deltaCols`): `boolean`

Updates the number of rows and columns of a matrix input. Thes function is mainly called internally.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `matrixId` | `string` | - |
| `deltaRows` | `number` | Nnumber of rows added (subtracted). |
| `deltaCols` | `number` | Nnumber of columns added (subtracted). |

#### Returns

`boolean`

success

#### Defined in

index.ts:199

___

### refreshQuestion

▸ **refreshQuestion**(`questionID`): `boolean`

Refreshes the HTML elements of a questions. This is mainly required for matrices that can be resized by students. This function is mainly called internally.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

success.

#### Defined in

index.ts:187

___

### setLanguage

▸ **setLanguage**(`langID`): `void`

Sets the language for text outputs. Default is "en" := English.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `langID` | `string` | Language identifier (one of {"en", "de"}). |

#### Returns

`void`

#### Defined in

index.ts:67

___

### setQuestionBodyHtmlElement

▸ **setQuestionBodyHtmlElement**(`questionID`, `element`): `boolean`

Sets the HTML element that contains the question body. This function must be called once before quiz evaluation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `element` | `HTMLElement` | HTML element that contains the question body. |

#### Returns

`boolean`

success

#### Defined in

index.ts:120

# Language Grammar

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
