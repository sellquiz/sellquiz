[sellquiz](README.md) / Exports

# sellquiz

## Table of contents

### Functions

- [\_\_ideCreationFuntion](modules.md#__idecreationfuntion)
- [autoCreateQuiz](modules.md#autocreatequiz)
- [autoEvaluateQuiz](modules.md#autoevaluatequiz)
- [backupQuestion](modules.md#backupquestion)
- [createQuestion](modules.md#createquestion)
- [createQuestionFromBackup](modules.md#createquestionfrombackup)
- [disableInputFields](modules.md#disableinputfields)
- [enableInputFields](modules.md#enableinputfields)
- [evaluateQuestion](modules.md#evaluatequestion)
- [getErrorLog](modules.md#geterrorlog)
- [getFeedbackText](modules.md#getfeedbacktext)
- [getQuestionBody](modules.md#getquestionbody)
- [getQuestionInputFields](modules.md#getquestioninputfields)
- [getQuestionTitle](modules.md#getquestiontitle)
- [getScore](modules.md#getscore)
- [readStudentAnswersFromHtmlElements](modules.md#readstudentanswersfromhtmlelements)
- [refreshMatrixDimensions](modules.md#refreshmatrixdimensions)
- [refreshQuestion](modules.md#refreshquestion)
- [reset](modules.md#reset)
- [setGenerateInputFieldHtmlCode](modules.md#setgenerateinputfieldhtmlcode)
- [setLanguage](modules.md#setlanguage)
- [setQuestionHtmlElement](modules.md#setquestionhtmlelement)
- [setStudentAnswerManually](modules.md#setstudentanswermanually)
- [writeFeedbackToHtmlElements](modules.md#writefeedbacktohtmlelements)

## Functions

### \_\_ideCreationFuntion

▸ **__ideCreationFuntion**(`fct`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fct` | `any` |

#### Returns

`void`

#### Defined in

[index.ts:299](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L299)

___

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

[index.ts:40](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L40)

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

[index.ts:61](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L61)

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

[index.ts:136](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L136)

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

[index.ts:116](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L116)

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

[index.ts:127](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L127)

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

[index.ts:269](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L269)

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

[index.ts:260](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L260)

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

[index.ts:200](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L200)

___

### getErrorLog

▸ **getErrorLog**(): `string`

Gets the error log for the last created question.

#### Returns

`string`

Error log.

#### Defined in

[index.ts:153](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L153)

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

[index.ts:239](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L239)

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

[index.ts:174](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L174)

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

[index.ts:145](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L145)

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

[index.ts:162](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L162)

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

[index.ts:251](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L251)

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

[index.ts:209](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L209)

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

[index.ts:294](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L294)

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

[index.ts:278](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L278)

___

### reset

▸ **reset**(): `void`

Remove all questions.

#### Returns

`void`

#### Defined in

[index.ts:28](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L28)

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

[index.ts:107](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L107)

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

[index.ts:91](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L91)

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

[index.ts:187](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L187)

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

[index.ts:220](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L220)

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

[index.ts:229](https://github.com/sellquiz/sellquiz/blob/06723f2/src/index.ts#L229)
