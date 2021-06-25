[sellquiz](README.md) / Exports

# sellquiz

## Table of contents

### Functions

- [autoCreateQuiz](modules.md#autocreatequiz)
- [autoEvaluateQuiz](modules.md#autoevaluatequiz)
- [createQuestion](modules.md#createquestion)
- [disableInputFields](modules.md#disableinputfields)
- [enableInputFields](modules.md#enableinputfields)
- [evaluateQuestion](modules.md#evaluatequestion)
- [getErrorLog](modules.md#geterrorlog)
- [getFeedbackText](modules.md#getfeedbacktext)
- [getQuestionBody](modules.md#getquestionbody)
- [getQuestionTitle](modules.md#getquestiontitle)
- [getScore](modules.md#getscore)
- [refreshMatrixDimensions](modules.md#refreshmatrixdimensions)
- [refreshQuestion](modules.md#refreshquestion)
- [setLanguage](modules.md#setlanguage)
- [setQuestionBodyHtmlElement](modules.md#setquestionbodyhtmlelement)

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

[index.ts:31](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L31)

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

[index.ts:52](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L52)

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

[index.ts:76](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L76)

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

[index.ts:178](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L178)

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

[index.ts:169](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L169)

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

[index.ts:133](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L133)

___

### getErrorLog

▸ **getErrorLog**(): `string`

Gets the error log for the last created question.

#### Returns

`string`

Error log.

#### Defined in

[index.ts:86](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L86)

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

[index.ts:148](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L148)

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

[index.ts:107](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L107)

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

[index.ts:95](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L95)

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

[index.ts:160](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L160)

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

[index.ts:199](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L199)

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

[index.ts:187](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L187)

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

[index.ts:67](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L67)

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

[index.ts:120](https://github.com/sellquiz/sellquiz/blob/1c09817/src/index.ts#L120)
