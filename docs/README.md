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

- Run `./install.sh` to install Node.js dependencies and check for other dependencies.
- Run `./build.sh` to build SELL.
- Open `index-highlevel.html` for a demonstration of the high-level API in the browser.
- Open `src/index-lowlevel.html` for a demonstration of the low-level API in the browser.
- You'll find a demonstration of the low-level API for Node.js in file `index-lowlevel-api.ts`.

(We provide a VS Code launch configuration in `.code/launch.json`.)

- For debugging, you may use `src/test.ts` (a launch configuration for VS Code is available). This file parses imported SELL-questions with Node.js and writes also `test-sell.html`, which can be tested in a web browser. Refer to the information in the terminal output.

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

Success.

#### Defined in

[index.ts:38](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L38)

___

### autoEvaluateQuiz

▸ **autoEvaluateQuiz**(`questionID`, `htmlQuestionElementID`): `boolean`

Evaluates a quiz that has been created by autoCreateQuiz(..). This function is called automatically.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `htmlQuestionElementID` | `string` | Identifier of the (global) HTML element that contains all questions. |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:59](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L59)

___

### backupQuestion

▸ **backupQuestion**(`questionID`): `string`

Creates a backup of a question which includes internal states (for example random variables).

**`resturns`** Stringified JSON object of the question state or null in case that an error occourred.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`string`

#### Defined in

[index.ts:113](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L113)

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

[index.ts:93](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L93)

___

### createQuestionFromBackup

▸ **createQuestionFromBackup**(`questionBackupStr`): `number`

Creates a new question from a question backup (refer to function backupQuestion(..)).

#### Parameters

| Name | Type |
| :------ | :------ |
| `questionBackupStr` | `string` |

#### Returns

`number`

Question index or -1 in case of errors.

#### Defined in

[index.ts:104](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L104)

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

Success.

#### Defined in

[index.ts:246](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L246)

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

Success.

#### Defined in

[index.ts:237](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L237)

___

### evaluateQuestion

▸ **evaluateQuestion**(`questionID`): `boolean`

Evaluates the student answers of a question. This function does NOT read and write HTML elements. Also refer to functions "readStudentAnswersFromHtmlElements" and "writeFeedbackToHtmlElements".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:177](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L177)

___

### getErrorLog

▸ **getErrorLog**(): `string`

Gets the error log for the last created question.

#### Returns

`string`

Error log.

#### Defined in

[index.ts:130](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L130)

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

Success.

#### Defined in

[index.ts:216](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L216)

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

[index.ts:151](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L151)

___

### getQuestionInputFields

▸ **getQuestionInputFields**(`questionID`): [{ [id: string]: `string`;  }]

Gets the input fields of a question. *

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

[{ [id: string]: `string`;  }]

Array of dictionaries with entries "element_id" for the HTML element identifier, "element_type" for the HTML element type (refer to enum SellInputElementType in file quiz.js) and "solution_variable_id" the identifier of the corresponding soluion variable.

#### Defined in

[index.ts:122](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L122)

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

[index.ts:139](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L139)

___

### getScore

▸ **getScore**(`questionID`): `number`

Gets the evaluation score of an already evaluted question.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question Index. |

#### Returns

`number`

Score in range [0, 1]

#### Defined in

[index.ts:228](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L228)

___

### readStudentAnswersFromHtmlElements

▸ **readStudentAnswersFromHtmlElements**(`questionID`): `boolean`

Reads student answers from HTML elements. Also refer to functions "evaluateQuestion" and "writeFeedbackToHtmlElements".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:186](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L186)

___

### refreshMatrixDimensions

▸ **refreshMatrixDimensions**(`questionID`, `matrixId`, `deltaRows`, `deltaCols`): `boolean`

Updates the number of rows and columns of a matrix input. Thes function is mainly called internally.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `matrixId` | `string` | - |
| `deltaRows` | `number` | Number of rows added (subtracted). |
| `deltaCols` | `number` | Number of columns added (subtracted). |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:267](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L267)

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

Success.

#### Defined in

[index.ts:255](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L255)

___

### reset

▸ **reset**(): `void`

Remove all questions.

#### Returns

`void`

#### Defined in

[index.ts:28](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L28)

___

### setGenerateInputFieldHtmlCode

▸ **setGenerateInputFieldHtmlCode**(`enable?`): `void`

Enables (or disables) the generation of HTML code for input and feedback element.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `enable` | `boolean` | `true` | If false, then getQuestionBody() returns HTML code that includes only placeholders for input and feedback fields. Placeholders have the form '$$ID', where ID can be obtained by calling getQuestionInputFields(). |

#### Returns

`void`

#### Defined in

[index.ts:84](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L84)

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

[index.ts:76](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L76)

___

### setQuestionHtmlElement

▸ **setQuestionHtmlElement**(`questionID`, `element`): `boolean`

Sets the HTML element that contains the question body (Alternatively, the element can also be a parent element of the question body). This function must be called once before calling "readStudentAnswersFromHtmlElements" or "writeFeedbackToHtmlElements".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `element` | `HTMLElement` | HTML element that contains the question body. |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:164](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L164)

___

### setStudentAnswerManually

▸ **setStudentAnswerManually**(`questionID`, `solutionVariableID`, `answerStr`): `boolean`

Sets a student answer string manually. Also refer to functions "getInputElements" and "backupQuestion"

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |
| `solutionVariableID` | `string` | - |
| `answerStr` | `string` | Answer string in ASCII-math encoding (e.g. "a+bi" for complex numbers, "[a,b,c]" for vectors, "[[a,b],[c,d]]" for matrices). |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:197](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L197)

___

### writeFeedbackToHtmlElements

▸ **writeFeedbackToHtmlElements**(`questionID`): `boolean`

Writes feedback to HTML elements. Also refer to functions "evaluateQuestion" and "readStudentAnswersFromHtmlElements".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `questionID` | `number` | Question index. |

#### Returns

`boolean`

Success.

#### Defined in

[index.ts:206](https://github.com/sellquiz/sellquiz/blob/6766b2a/src/index.ts#L206)

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
